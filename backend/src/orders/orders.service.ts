import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '../entities/order.entity.js';
import { ProductVariant } from '../entities/catalog.entity.js';
import { MovementType } from '../entities/inventory.entity.js';
import { InventoryService } from '../inventory/inventory.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(data: {
    orderType: OrderType;
    clientId?: string;
    customerName?: string;
    customerNitOrCi?: string;
    branchId?: string;
    cashierId?: string;
    paymentMethod: PaymentMethod;
    paymentTransactionId?: string;
    deliveryAddress?: string;
    items: { variantId: string; quantity: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La orden no tiene productos');
    }

    const count = await this.orderRepo.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    const orderItemsToSave: Partial<OrderItem>[] = [];

    // Calcular precios y verificar variantes
    for (const item of data.items) {
      const variant = await this.variantRepo.findOne({
        where: { id: item.variantId },
        relations: { product: true },
      });
      if (!variant) {
        throw new NotFoundException(`Variante de prenda ${item.variantId} no encontrada`);
      }

      const unitPrice = Number(variant.product.basePrice) + Number(variant.priceAdjustment || 0);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsToSave.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const tax = 0; // O tasa aplicable (ej. 13% en Bolivia / o incluido)
    const total = subtotal + tax;

    const order = this.orderRepo.create({
      orderNumber,
      orderType: data.orderType,
      clientId: data.clientId,
      customerName: data.customerName,
      customerNitOrCi: data.customerNitOrCi,
      branchId: data.branchId,
      cashierId: data.cashierId,
      paymentMethod: data.paymentMethod,
      paymentTransactionId: data.paymentTransactionId || `TRX-${Date.now()}`,
      status: OrderStatus.PAID,
      deliveryAddress: data.deliveryAddress,
      subtotal,
      tax,
      total,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Guardar los items y descontar automáticamente del inventario (OUT_SALE)
    for (const itemData of orderItemsToSave) {
      const ordItem = this.itemRepo.create({
        ...itemData,
        orderId: savedOrder.id,
      });
      await this.itemRepo.save(ordItem);

      // Si la venta tiene sucursal asociada (ej. POS presencial o retiro/despacho en sucursal)
      if (data.branchId) {
        await this.inventoryService.registerMovement({
          branchId: data.branchId,
          variantId: itemData.variantId!,
          movementType: MovementType.OUT_SALE,
          quantity: itemData.quantity!,
          referenceCode: orderNumber,
          notes: `Venta ${data.orderType} ${orderNumber}`,
          userId: data.cashierId || data.clientId,
        });
      }
    }

    return this.findOne(savedOrder.id);
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        client: true,
        branch: true,
        cashier: true,
        items: { variant: { product: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    return order;
  }

  async findClientOrders(clientId: string) {
    return this.orderRepo.find({
      where: { clientId },
      relations: {
        items: { variant: { product: true } },
        branch: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findBranchOrders(branchId: string) {
    return this.orderRepo.find({
      where: { branchId },
      relations: {
        items: { variant: { product: true } },
        cashier: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrders() {
    return this.orderRepo.find({
      relations: {
        client: true,
        branch: true,
        cashier: true,
        items: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async simulatePayment(method: PaymentMethod, amount: number) {
    // Simula procesamiento con Pasarela Digital (Stripe / Libélula / QR Simple)
    return {
      success: true,
      transactionId: `TXN-${method}-${Date.now()}`,
      status: 'APPROVED',
      amount,
      method,
      timestamp: new Date().toISOString(),
      qrCodeData: method === PaymentMethod.QR ? `STP_QR_${Date.now()}_AMOUNT_${amount}` : null,
    };
  }
}
