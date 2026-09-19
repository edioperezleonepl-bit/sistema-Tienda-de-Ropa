import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchInventory, InventoryMovement, MovementType } from '../entities/inventory.entity.js';
import { ProductVariant } from '../entities/catalog.entity.js';
import { Branch } from '../entities/branch.entity.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BranchInventory)
    private readonly inventoryRepo: Repository<BranchInventory>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async getBranchStock(branchId: string) {
    return this.inventoryRepo.find({
      where: { branchId },
      relations: {
        variant: { product: true },
        branch: true,
      },
      order: { stockQuantity: 'ASC' },
    });
  }

  async getGlobalConsolidatedInventory() {
    return this.inventoryRepo.find({
      relations: {
        branch: true,
        variant: { product: { category: true } },
      },
    });
  }

  async getMovements(filter?: { branchId?: string; variantId?: string }) {
    const query = this.movementRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.branch', 'branch')
      .leftJoinAndSelect('movement.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('movement.createdByUser', 'user');

    if (filter?.branchId) {
      query.andWhere('movement.branchId = :branchId', { branchId: filter.branchId });
    }
    if (filter?.variantId) {
      query.andWhere('movement.variantId = :variantId', { variantId: filter.variantId });
    }

    return query.orderBy('movement.createdAt', 'DESC').take(100).getMany();
  }

  async registerMovement(data: {
    branchId: string;
    variantId: string;
    movementType: MovementType;
    quantity: number;
    referenceCode?: string;
    notes?: string;
    userId?: string;
  }) {
    if (data.quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    let inventory = await this.inventoryRepo.findOne({
      where: { branchId: data.branchId, variantId: data.variantId },
    });

    if (!inventory) {
      inventory = this.inventoryRepo.create({
        branchId: data.branchId,
        variantId: data.variantId,
        stockQuantity: 0,
        reservedQuantity: 0,
      });
    }

    switch (data.movementType) {
      case MovementType.IN_PURCHASE:
      case MovementType.TRANSFER_IN:
        inventory.stockQuantity += data.quantity;
        break;

      case MovementType.OUT_SALE:
        if (inventory.stockQuantity < data.quantity) {
          throw new BadRequestException(
            `Stock insuficiente en sucursal. Disponible: ${inventory.stockQuantity}, Requerido: ${data.quantity}`,
          );
        }
        inventory.stockQuantity -= data.quantity;
        break;

      case MovementType.RESERVE_HOLD:
        if (inventory.stockQuantity < data.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para reservar. Disponible: ${inventory.stockQuantity}, Requerido: ${data.quantity}`,
          );
        }
        inventory.stockQuantity -= data.quantity;
        inventory.reservedQuantity += data.quantity;
        break;

      case MovementType.RESERVE_RELEASE:
        if (inventory.reservedQuantity < data.quantity) {
          inventory.reservedQuantity = 0;
        } else {
          inventory.reservedQuantity -= data.quantity;
        }
        inventory.stockQuantity += data.quantity;
        break;

      case MovementType.TRANSFER_OUT:
        if (inventory.stockQuantity < data.quantity) {
          throw new BadRequestException('Stock insuficiente para traspaso de sucursal');
        }
        inventory.stockQuantity -= data.quantity;
        break;

      case MovementType.ADJUSTMENT:
        inventory.stockQuantity = data.quantity; // En ajuste directo define la nueva existencia
        break;
    }

    await this.inventoryRepo.save(inventory);

    const movement = this.movementRepo.create({
      branchId: data.branchId,
      variantId: data.variantId,
      movementType: data.movementType,
      quantity: data.quantity,
      referenceCode: data.referenceCode,
      notes: data.notes,
      createdByUserId: data.userId,
    });

    await this.movementRepo.save(movement);

    return {
      success: true,
      currentStock: inventory.stockQuantity,
      reservedStock: inventory.reservedQuantity,
      movement,
    };
  }

  async setInitialStock(branchId: string, variantId: string, quantity: number) {
    let inv = await this.inventoryRepo.findOne({
      where: { branchId, variantId },
    });
    if (!inv) {
      inv = this.inventoryRepo.create({
        branchId,
        variantId,
        stockQuantity: quantity,
        reservedQuantity: 0,
      });
    } else {
      inv.stockQuantity = quantity;
    }
    return this.inventoryRepo.save(inv);
  }
}
