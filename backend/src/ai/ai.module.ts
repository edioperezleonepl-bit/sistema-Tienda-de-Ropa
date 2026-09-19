import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/catalog.entity.js';
import { Order } from '../entities/order.entity.js';
import { FittingReservation } from '../entities/reservation.entity.js';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, FittingReservation])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
