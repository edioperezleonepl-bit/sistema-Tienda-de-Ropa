import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Branch } from './branch.entity.js';
import { ProductVariant } from './catalog.entity.js';
import { User } from './user.entity.js';

@Entity('branch_inventories')
@Index(['branchId', 'variantId'], { unique: true })
export class BranchInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ default: 0 })
  stockQuantity: number; // Disponible para venta inmediata

  @Column({ default: 0 })
  reservedQuantity: number; // En espera para probar en vestidor físico

  @Column({ default: 3 })
  alertThreshold: number; // Alerta de stock bajo
}

export enum MovementType {
  IN_PURCHASE = 'IN_PURCHASE',            // Entrada por compra a proveedor
  OUT_SALE = 'OUT_SALE',                  // Salida por venta digital o POS
  RESERVE_HOLD = 'RESERVE_HOLD',          // Bloqueado temporalmente para vestidor
  RESERVE_RELEASE = 'RESERVE_RELEASE',    // Liberado al cancelar o no comprar
  TRANSFER_IN = 'TRANSFER_IN',            // Entrada por traspaso de otra sucursal
  TRANSFER_OUT = 'TRANSFER_OUT',          // Salida por traspaso a otra sucursal
  ADJUSTMENT = 'ADJUSTMENT',              // Corrección manual de inventario
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  referenceCode: string; // Order # o Reservation #

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
