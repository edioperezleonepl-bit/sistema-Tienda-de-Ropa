import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import {
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
  InventoryMovement,
  FittingReservation,
  ReservationItem,
  Order,
  OrderItem,
} from './entities/index.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AiModule } from './ai/ai.module.js';
import { SeedModule } from './seed/seed.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_DATABASE || 'fashionstore',
      entities: [
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
        InventoryMovement,
        FittingReservation,
        ReservationItem,
        Order,
        OrderItem,
      ],
      synchronize: true, // Automático para desarrollo / prototipo de examen
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    UsersModule,
    BranchesModule,
    CatalogModule,
    InventoryModule,
    ReservationsModule,
    OrdersModule,
    AiModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
