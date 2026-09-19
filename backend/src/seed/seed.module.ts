import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { City, Branch } from '../entities/branch.entity.js';
import {
  Category,
  Season,
  Collection,
  Supplier,
  Product,
  ProductVariant,
} from '../entities/catalog.entity.js';
import { BranchInventory } from '../entities/inventory.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      City,
      Branch,
      Category,
      Season,
      Collection,
      Supplier,
      Product,
      ProductVariant,
      BranchInventory,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
