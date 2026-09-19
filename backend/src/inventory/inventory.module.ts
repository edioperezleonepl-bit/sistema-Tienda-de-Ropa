import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchInventory, InventoryMovement } from '../entities/inventory.entity.js';
import { ProductVariant } from '../entities/catalog.entity.js';
import { Branch } from '../entities/branch.entity.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BranchInventory,
      InventoryMovement,
      ProductVariant,
      Branch,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
