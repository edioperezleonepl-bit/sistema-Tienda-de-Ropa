import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity.js';
import { City, Branch } from '../entities/branch.entity.js';
import {
  Category,
  Season,
  Collection,
  Supplier,
  Product,
  ProductVariant,
  ARAnchorType,
} from '../entities/catalog.entity.js';
import { BranchInventory } from '../entities/inventory.entity.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(City) private cityRepo: Repository<City>,
    @InjectRepository(Branch) private branchRepo: Repository<Branch>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Season) private seasonRepo: Repository<Season>,
    @InjectRepository(Collection) private collectionRepo: Repository<Collection>,
    @InjectRepository(Supplier) private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(BranchInventory) private inventoryRepo: Repository<BranchInventory>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAll();
  }

  async seedAll() {
    const existingUsers = await this.userRepo.count();
    if (existingUsers > 0) {
      this.logger.log('Base de datos ya cuenta con registros. Saltando seed.');
      return;
    }

    this.logger.log('Iniciando carga de datos semilla (Seed)...');

    // 1. Ciudades
    const scz = await this.cityRepo.save(this.cityRepo.create({ name: 'Santa Cruz', department: 'Santa Cruz' }));
    const lpz = await this.cityRepo.save(this.cityRepo.create({ name: 'La Paz', department: 'La Paz' }));
    const cbb = await this.cityRepo.save(this.cityRepo.create({ name: 'Cochabamba', department: 'Cochabamba' }));

    // 2. Sucursales
    const b1 = await this.branchRepo.save(
      this.branchRepo.create({
        name: 'Sucursal Equipetrol Norte',
        address: 'Av. San Martín esq. Calle 7, Equipetrol',
        phone: '+591 3 3456789',
        fittingRoomsCount: 6,
        openTime: '09:00',
        closeTime: '21:00',
        cityId: scz.id,
      }),
    );

    const b2 = await this.branchRepo.save(
      this.branchRepo.create({
        name: 'Sucursal Ventura Mall',
        address: '4to Anillo y Av. San Martín, Nivel 2',
        phone: '+591 3 3881234',
        fittingRoomsCount: 8,
        openTime: '10:00',
        closeTime: '22:00',
        cityId: scz.id,
      }),
    );

    const b3 = await this.branchRepo.save(
      this.branchRepo.create({
        name: 'Sucursal Calacoto Sur',
        address: 'Av. Ballivián entre Calle 12 y 13',
        phone: '+591 2 2789012',
        fittingRoomsCount: 5,
        openTime: '09:30',
        closeTime: '20:30',
        cityId: lpz.id,
      }),
    );

    const branches = [b1, b2, b3];

    // 3. Usuarios de prueba (todos con clave '123456')
    const salt = await bcrypt.genSalt(10);
    const pwdHash = await bcrypt.hash('123456', salt);

    await this.userRepo.save([
      this.userRepo.create({
        email: 'admin@fashionstore.com',
        passwordHash: pwdHash,
        fullName: 'Ing. Carlos Mendoza (Admin)',
        phone: '+591 71000001',
        role: UserRole.ADMIN,
      }),
      this.userRepo.create({
        email: 'encargado@fashionstore.com',
        passwordHash: pwdHash,
        fullName: 'Valeria Rios (Encargada Sucursal)',
        phone: '+591 72000002',
        role: UserRole.BRANCH_MANAGER,
        branchId: b1.id,
      }),
      this.userRepo.create({
        email: 'cajero@fashionstore.com',
        passwordHash: pwdHash,
        fullName: 'Marcos Fernandez (Cajero)',
        phone: '+591 73000003',
        role: UserRole.CASHIER,
        branchId: b1.id,
      }),
      this.userRepo.create({
        email: 'cliente@fashionstore.com',
        passwordHash: pwdHash,
        fullName: 'Sofia Navarro (Cliente)',
        phone: '+591 74000004',
        role: UserRole.CLIENT,
      }),
      this.userRepo.create({
        email: 'proveedor@fashionstore.com',
        passwordHash: pwdHash,
        fullName: 'Textiles Andinos Corp (Proveedor)',
        phone: '+591 75000005',
        role: UserRole.SUPPLIER,
      }),
    ]);

    // 4. Temporadas
    const s1 = await this.seasonRepo.save(this.seasonRepo.create({ name: 'Primavera - Verano 2026', year: 2026, isActive: true }));
    const s2 = await this.seasonRepo.save(this.seasonRepo.create({ name: 'Otoño - Invierno 2026', year: 2026, isActive: true }));
    const s3 = await this.seasonRepo.save(this.seasonRepo.create({ name: 'Temporada Escolar / Juvenil', year: 2026, isActive: false }));

    // 5. Colecciones
    const col1 = await this.collectionRepo.save(this.collectionRepo.create({ name: 'Urban Chic 2026', seasonId: s1.id, description: 'Moda cosmopolita y ligera' }));
    const col2 = await this.collectionRepo.save(this.collectionRepo.create({ name: 'Alta Gala & Noche', seasonId: s1.id, description: 'Prendas formales y vestidos' }));
    const col3 = await this.collectionRepo.save(this.collectionRepo.create({ name: 'Denim & Streetwear', seasonId: s2.id, description: 'Prendas versátiles' }));

    // 6. Proveedores
    const sup1 = await this.supplierRepo.save(this.supplierRepo.create({ name: 'Confecciones del Valle', contactPerson: 'Roberto Arce', email: 'ventas@confeccionesvalle.com', phone: '+591 4 4112233' }));
    const sup2 = await this.supplierRepo.save(this.supplierRepo.create({ name: 'Moda Latina Exports', contactPerson: 'Mariana Suarez', email: 'contacto@modalatina.com', phone: '+591 3 3224455' }));

    // 7. Categorías
    const catVestidos = await this.categoryRepo.save(this.categoryRepo.create({ name: 'Vestidos', description: 'Vestidos de fiesta, cóctel y casuales', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800' }));
    const catChaquetas = await this.categoryRepo.save(this.categoryRepo.create({ name: 'Chaquetas y Abrigos', description: 'Blazers, cazadoras y sacos', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800' }));
    const catCamisas = await this.categoryRepo.save(this.categoryRepo.create({ name: 'Camisas y Blusas', description: 'Elegantes y casuales', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800' }));
    const catPantalones = await this.categoryRepo.save(this.categoryRepo.create({ name: 'Pantalones y Jeans', description: 'Cortes rectos, slim y joggers', imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800' }));

    // 8. Productos
    const productsData = [
      {
        name: 'Blazer Ejecutivo Slim Fit',
        description: 'Blazer de corte moderno con solapa clásica, forro interior satinado y botones con acabado mate. Ideal para eventos formales o reuniones de trabajo.',
        sku: 'BLZ-001',
        basePrice: 68.0,
        categoryId: catChaquetas.id,
        seasonId: s1.id,
        collectionId: col1.id,
        supplierId: sup1.id,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
        ]),
        arOverlayImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
        arAnchorType: ARAnchorType.TORSO,
        isFeatured: true,
        variants: [
          { size: 'S', colorName: 'Azul Marino', colorHex: '#1E3A8A', sku: 'BLZ-001-S-BLU', priceAdjustment: 0 },
          { size: 'M', colorName: 'Azul Marino', colorHex: '#1E3A8A', sku: 'BLZ-001-M-BLU', priceAdjustment: 0 },
          { size: 'L', colorName: 'Negro Clásico', colorHex: '#111827', sku: 'BLZ-001-L-BLK', priceAdjustment: 5 },
          { size: 'XL', colorName: 'Gris Grafito', colorHex: '#4B5563', sku: 'BLZ-001-XL-GRY', priceAdjustment: 5 },
        ],
      },
      {
        name: 'Vestido de Noche Escote Espalda',
        description: 'Vestido largo con caída fluida, confeccionado en satén premium con detalle de lazo en la cintura y espalda descubierta.',
        sku: 'VES-002',
        basePrice: 95.0,
        categoryId: catVestidos.id,
        seasonId: s1.id,
        collectionId: col2.id,
        supplierId: sup2.id,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        ]),
        arOverlayImageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
        arAnchorType: ARAnchorType.FULL_BODY,
        isFeatured: true,
        variants: [
          { size: 'XS', colorName: 'Rojo Carmesí', colorHex: '#DC2626', sku: 'VES-002-XS-RED', priceAdjustment: 0 },
          { size: 'S', colorName: 'Rojo Carmesí', colorHex: '#DC2626', sku: 'VES-002-S-RED', priceAdjustment: 0 },
          { size: 'M', colorName: 'Esmeralda', colorHex: '#059669', sku: 'VES-002-M-GRN', priceAdjustment: 0 },
          { size: 'L', colorName: 'Negro Ónix', colorHex: '#000000', sku: 'VES-002-L-BLK', priceAdjustment: 0 },
        ],
      },
      {
        name: 'Camisa Oxford Algodón 100%',
        description: 'Camisa formal con textura suave de piqué, botones nacarados y cuello reforzado. Transpirable y antiarrugas.',
        sku: 'CAM-003',
        basePrice: 42.0,
        categoryId: catCamisas.id,
        seasonId: s1.id,
        collectionId: col1.id,
        supplierId: sup1.id,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        ]),
        arOverlayImageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
        arAnchorType: ARAnchorType.TORSO,
        isFeatured: false,
        variants: [
          { size: 'S', colorName: 'Blanco Puro', colorHex: '#FFFFFF', sku: 'CAM-003-S-WHT', priceAdjustment: 0 },
          { size: 'M', colorName: 'Blanco Puro', colorHex: '#FFFFFF', sku: 'CAM-003-M-WHT', priceAdjustment: 0 },
          { size: 'L', colorName: 'Celeste Cielo', colorHex: '#38BDF8', sku: 'CAM-003-L-SKY', priceAdjustment: 0 },
        ],
      },
      {
        name: 'Jeans Relaxed Denim Vintage',
        description: 'Pantalón vaquero de tiro medio con lavado localizado y resistencia de alta durabilidad.',
        sku: 'JNS-004',
        basePrice: 55.0,
        categoryId: catPantalones.id,
        seasonId: s2.id,
        collectionId: col3.id,
        supplierId: sup2.id,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1542272604-780c96856592?w=800',
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
        ]),
        arOverlayImageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800',
        arAnchorType: ARAnchorType.LEGS,
        isFeatured: true,
        variants: [
          { size: '30', colorName: 'Azul Medio', colorHex: '#2563EB', sku: 'JNS-004-30-MED', priceAdjustment: 0 },
          { size: '32', colorName: 'Azul Medio', colorHex: '#2563EB', sku: 'JNS-004-32-MED', priceAdjustment: 0 },
          { size: '34', colorName: 'Negro Lavado', colorHex: '#374151', sku: 'JNS-004-34-BLK', priceAdjustment: 0 },
        ],
      },
      {
        name: 'Cazadora de Cuero Sintético Biker',
        description: 'Chaqueta estilo motero con cremalleras metálicas plateadas, forro acolchado térmico y cuello con botón de presión.',
        sku: 'CZ-005',
        basePrice: 89.0,
        categoryId: catChaquetas.id,
        seasonId: s2.id,
        collectionId: col3.id,
        supplierId: sup1.id,
        imagesJson: JSON.stringify([
          'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        ]),
        arOverlayImageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800',
        arAnchorType: ARAnchorType.TORSO,
        isFeatured: true,
        variants: [
          { size: 'S', colorName: 'Negro Cuero', colorHex: '#09090B', sku: 'CZ-005-S-BLK', priceAdjustment: 0 },
          { size: 'M', colorName: 'Negro Cuero', colorHex: '#09090B', sku: 'CZ-005-M-BLK', priceAdjustment: 0 },
          { size: 'L', colorName: 'Café Coñac', colorHex: '#78350F', sku: 'CZ-005-L-BRN', priceAdjustment: 5 },
        ],
      },
    ];

    for (const prodData of productsData) {
      const { variants, ...pInfo } = prodData;
      const product = await this.productRepo.save(this.productRepo.create(pInfo));

      for (const vData of variants) {
        const variant = await this.variantRepo.save(
          this.variantRepo.create({
            ...vData,
            productId: product.id,
          }),
        );

        // Sembrar existencias en cada sucursal (6 a 15 unidades por sucursal)
        for (const branch of branches) {
          const randomStock = Math.floor(Math.random() * 10) + 6;
          await this.inventoryRepo.save(
            this.inventoryRepo.create({
              branchId: branch.id,
              variantId: variant.id,
              stockQuantity: randomStock,
              reservedQuantity: 0,
              alertThreshold: 3,
            }),
          );
        }
      }
    }

    this.logger.log('Seed completado con éxito: Ciudades, Sucursales, Usuarios, Catálogo e Inventarios.');
  }
}
