import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}

@Entity('seasons')
export class Season {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g. Primavera-Verano, Otoño-Invierno, Escolar

  @Column({ default: 2026 })
  year: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.season)
  products: Product[];
}

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  seasonId: string;

  @ManyToOne(() => Season, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seasonId' })
  season: Season;

  @OneToMany(() => Product, (product) => product.collection)
  products: Product[];
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => Product, (product) => product.supplier)
  products: Product[];
}

export enum ARAnchorType {
  TORSO = 'TORSO',        // Camisas, blusas, chaquetas
  LEGS = 'LEGS',          // Pantalones, faldas, shorts
  FULL_BODY = 'FULL_BODY',// Vestidos, enterizos, abrigos
  HEAD = 'HEAD',          // Sombreros, gorros, gafas
  FEET = 'FEET',          // Zapatos, zapatillas
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'text', nullable: true })
  imagesJson: string; // JSON array of image URLs

  @Column({ nullable: true })
  arOverlayImageUrl: string; // Transparent PNG / WebP for AR clothing overlay

  @Column({ nullable: true })
  arModel3dUrl: string; // GLB / GLTF 3D model if available

  @Column({
    type: 'enum',
    enum: ARAnchorType,
    default: ARAnchorType.TORSO,
  })
  arAnchorType: ARAnchorType;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, (cat) => cat.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  seasonId: string;

  @ManyToOne(() => Season, (season) => season.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seasonId' })
  season: Season;

  @Column({ nullable: true })
  collectionId: string;

  @ManyToOne(() => Collection, (col) => col.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @Column({ nullable: true })
  supplierId: string;

  @ManyToOne(() => Supplier, (sup) => sup.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: ProductVariant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  size: string; // XS, S, M, L, XL, XXL, etc.

  @Column()
  colorName: string; // Negro, Blanco, Azul Marino, Rojo

  @Column({ default: '#000000' })
  colorHex: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment: number;
}
