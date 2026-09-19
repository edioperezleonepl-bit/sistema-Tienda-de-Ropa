import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Category,
  Season,
  Collection,
  Supplier,
  Product,
  ProductVariant,
} from '../entities/catalog.entity.js';
import { BranchInventory } from '../entities/inventory.entity.js';
import { CatalogService } from './catalog.service.js';
import { CatalogController } from './catalog.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Season,
      Collection,
      Supplier,
      Product,
      ProductVariant,
      BranchInventory,
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
