import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../entities/user.entity.js';
import { OrderType, PaymentMethod } from '../entities/order.entity.js';

@ApiTags('Ventas y Puntos de Caja (POS)')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout/digital')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Realizar compra digital desde Web o Móvil' })
  createDigitalOrder(
    @Body()
    body: {
      branchId?: string;
      deliveryAddress?: string;
      paymentMethod: PaymentMethod;
      paymentTransactionId?: string;
      items: { variantId: string; quantity: number }[];
    },
    @CurrentUser() user: User,
  ) {
    return this.ordersService.createOrder({
      ...body,
      orderType: OrderType.DIGITAL,
      clientId: user.id,
      customerName: user.fullName,
    });
  }

  @Post('pos/presential')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CASHIER, UserRole.BRANCH_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar venta presencial en punto de caja (Cajero)' })
  createPosOrder(
    @Body()
    body: {
      customerName?: string;
      customerNitOrCi?: string;
      paymentMethod: PaymentMethod;
      paymentTransactionId?: string;
      items: { variantId: string; quantity: number }[];
    },
    @CurrentUser() user: User,
  ) {
    return this.ordersService.createOrder({
      ...body,
      orderType: OrderType.POS_PRESENTIAL,
      branchId: user.branchId,
      cashierId: user.id,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial de compras del cliente' })
  getMyOrders(@CurrentUser() user: User) {
    return this.ordersService.findClientOrders(user.id);
  }

  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar ventas de una sucursal' })
  getBranchOrders(@Param('branchId') branchId: string) {
    return this.ordersService.findBranchOrders(branchId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listado global de ventas y órdenes (Admin)' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de una orden o ticket de venta' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post('payments/simulate')
  @ApiOperation({ summary: 'Simular cobro en pasarela digital (Stripe, Libélula, QR Simple)' })
  simulatePayment(@Body() body: { method: PaymentMethod; amount: number }) {
    return this.ordersService.simulatePayment(body.method, body.amount);
  }
}
