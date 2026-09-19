import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  department: string;

  @OneToMany(() => Branch, (branch) => branch.city)
  branches: Branch[];
}

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 4 })
  fittingRoomsCount: number;

  @Column({ default: '09:00' })
  openTime: string;

  @Column({ default: '21:00' })
  closeTime: string;

  @Column({ nullable: true })
  cityId: string;

  @ManyToOne(() => City, (city) => city.branches, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
