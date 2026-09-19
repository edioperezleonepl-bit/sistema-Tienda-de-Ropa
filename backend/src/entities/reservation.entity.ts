import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity.js';
import { Branch } from './branch.entity.js';
import { ProductVariant } from './catalog.entity.js';

export enum ReservationStatus {
  PENDING = 'PENDING',               // Recibida en sistema
  PREPARED = 'PREPARED',             // Encargado preparó las prendas en el perchero
  IN_FITTING_ROOM = 'IN_FITTING_ROOM', // Cliente llegó a sucursal y está probándose
  COMPLETED = 'COMPLETED',           // Atención finalizada (compró o devolvió)
  CANCELLED = 'CANCELLED',           // Cancelada por cliente o por vencimiento
}

@Entity('fitting_reservations')
export class FittingReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reservationCode: string; // e.g. RES-2026-0012

  @Column()
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'date' })
  reservationDate: string; // YYYY-MM-DD

  @Column()
  timeSlot: string; // e.g. "15:00 - 15:45"

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  assignedFittingRoom: number; // Número de probador físico asignado

  @OneToMany(() => ReservationItem, (item) => item.reservation, { cascade: true })
  items: ReservationItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reservation_items')
export class ReservationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reservationId: string;

  @ManyToOne(() => FittingReservation, (res) => res.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservationId' })
  reservation: FittingReservation;

  @Column()
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: false })
  isPrepared: boolean; // Marcado por el encargado cuando coloca la prenda en el perchero
}
