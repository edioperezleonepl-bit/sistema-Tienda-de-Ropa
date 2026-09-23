import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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
import { Branch } from '../entities/branch.entity.js';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Season)
    private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(BranchInventory)
    private readonly inventoryRepo: Repository<BranchInventory>,
  ) {}

  // Categorías
  async getCategories() {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async createCategory(data: Partial<Category>) {
    const cat = this.categoryRepo.create(data);
    return this.categoryRepo.save(cat);
  }

  // Temporadas
  async getSeasons() {
    return this.seasonRepo.find({ order: { year: 'DESC', name: 'ASC' } });
  }

  async createSeason(data: Partial<Season>) {
    const season = this.seasonRepo.create(data);
    return this.seasonRepo.save(season);
  }

  // Colecciones
  async getCollections(seasonId?: string) {
    if (seasonId) {
      return this.collectionRepo.find({ where: { seasonId }, relations: { season: true } });
    }
    return this.collectionRepo.find({ relations: { season: true } });
  }

  async createCollection(data: Partial<Collection>) {
    const col = this.collectionRepo.create(data);
    return this.collectionRepo.save(col);
  }

  // Proveedores
  async getSuppliers() {
    return this.supplierRepo.find({ order: { name: 'ASC' } });
  }

  async createSupplier(data: Partial<Supplier>) {
    const sup = this.supplierRepo.create(data);
    return this.supplierRepo.save(sup);
  }

  // Productos
  async getProducts(filter?: {
    categoryId?: string;
    seasonId?: string;
    search?: string;
    featured?: boolean;
    branchId?: string;
  }) {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.season', 'season')
      .leftJoinAndSelect('product.collection', 'collection')
      .leftJoinAndSelect('product.variants', 'variants');

    if (filter?.categoryId) {
      query.andWhere('product.categoryId = :catId', { catId: filter.categoryId });
    }
    if (filter?.seasonId) {
      query.andWhere('product.seasonId = :seasonId', { seasonId: filter.seasonId });
    }
    if (filter?.featured !== undefined) {
      query.andWhere('product.isFeatured = :featured', { featured: filter.featured });
    }
    if (filter?.search) {
      query.andWhere(
        '(LOWER(product.name) LIKE :term OR LOWER(product.description) LIKE :term OR LOWER(product.sku) LIKE :term)',
        { term: `%${filter.search.toLowerCase()}%` },
      );
    }

    const products = await query.orderBy('product.createdAt', 'DESC').getMany();

    // Si se especifica branchId, enriquecer con stock de la sucursal seleccionada
    if (filter?.branchId) {
      for (const product of products) {
        for (const variant of product.variants) {
          const inv = await this.inventoryRepo.findOne({
            where: { branchId: filter.branchId, variantId: variant.id },
          });
          (variant as any).branchStock = inv ? inv.stockQuantity : 0;
          (variant as any).branchReserved = inv ? inv.reservedQuantity : 0;
        }
      }
    }

    return products;
  }

  async getProductById(id: string, branchId?: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: {
        category: true,
        season: true,
        collection: true,
        supplier: true,
        variants: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Prenda no encontrada');
    }

    // Consultar stock en todas las sucursales para cada variante
    const variantStockPromises = product.variants.map(async (variant) => {
      const inventories = await this.inventoryRepo.find({
        where: { variantId: variant.id },
        relations: { branch: true },
      });
      return {
        ...variant,
        inventories: inventories.map((inv) => ({
          branchId: inv.branchId,
          branchName: inv.branch?.name,
          stockQuantity: inv.stockQuantity,
          reservedQuantity: inv.reservedQuantity,
        })),
      };
    });

    const enrichedVariants = await Promise.all(variantStockPromises);

    return {
      ...product,
      variants: enrichedVariants,
    };
  }

  async createProduct(data: {
    name: string;
    description?: string;
    sku: string;
    basePrice: number;
    categoryId?: string;
    seasonId?: string;
    collectionId?: string;
    supplierId?: string;
    imagesJson?: string;
    arOverlayImageUrl?: string;
    arModel3dUrl?: string;
    arAnchorType?: any;
    isFeatured?: boolean;
    initialStockPerBranch?: number;
    variants?: {
      size: string;
      colorName: string;
      colorHex: string;
      sku: string;
      priceAdjustment?: number;
    }[];
  }) {
    const { variants, initialStockPerBranch, ...productData } = data;

    // Normalizar ARAnchorType a mayúsculas
    if (productData.arAnchorType) {
      const anchorUpper = String(productData.arAnchorType).toUpperCase();
      if (['TORSO', 'LEGS', 'FULL_BODY', 'HEAD', 'FEET'].includes(anchorUpper)) {
        productData.arAnchorType = anchorUpper as any;
      } else {
        productData.arAnchorType = ARAnchorType.TORSO;
      }
    } else {
      productData.arAnchorType = ARAnchorType.TORSO;
    }

    try {
      const product = this.productRepo.create(productData);
      const savedProduct = await this.productRepo.save(product);

    if (variants && variants.length > 0) {
      const variantEntities = variants.map((v) =>
        this.variantRepo.create({
          ...v,
          productId: savedProduct.id,
        }),
      );
      savedProduct.variants = await this.variantRepo.save(variantEntities);

      // Asignar existencias iniciales en todas las sucursales
      const stockQty = initialStockPerBranch !== undefined ? Number(initialStockPerBranch) : 12;
      if (stockQty > 0) {
        const branches = await this.inventoryRepo.manager.find(Branch);
        for (const variant of savedProduct.variants) {
          for (const branch of branches) {
            await this.inventoryRepo.save(
              this.inventoryRepo.create({
                branchId: branch.id,
                variantId: variant.id,
                stockQuantity: stockQty,
                reservedQuantity: 0,
              }),
            );
          }
        }
      }
    }

      return this.getProductById(savedProduct.id);
    } catch (err) {
      console.error('ERROR AL CREAR PRODUCTO:', err);
      throw err;
    }
  }

  async updateProduct(id: string, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.getProductById(id);
  }

  async addVariant(productId: string, variantData: Partial<ProductVariant>) {
    const variant = this.variantRepo.create({
      ...variantData,
      productId,
    });
    return this.variantRepo.save(variant);
  }
}
