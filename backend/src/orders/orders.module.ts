import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from '../entities/order.entity.js';
import { ProductVariant } from '../entities/catalog.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, ProductVariant]), InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
