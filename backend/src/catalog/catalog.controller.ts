import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';

@ApiTags('Catálogo de Prendas')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear categoría (Solo Admin)' })
  createCategory(@Body() body: any) {
    return this.catalogService.createCategory(body);
  }

  @Get('seasons')
  @ApiOperation({ summary: 'Obtener temporadas comerciales' })
  getSeasons() {
    return this.catalogService.getSeasons();
  }

  @Post('seasons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear temporada comercial (Solo Admin)' })
  createSeason(@Body() body: any) {
    return this.catalogService.createSeason(body);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Obtener colecciones de moda' })
  @ApiQuery({ name: 'seasonId', required: false })
  getCollections(@Query('seasonId') seasonId?: string) {
    return this.catalogService.getCollections(seasonId);
  }

  @Post('collections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear colección (Solo Admin)' })
  createCollection(@Body() body: any) {
    return this.catalogService.createCollection(body);
  }

  @Get('suppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener lista de proveedores' })
  getSuppliers() {
    return this.catalogService.getSuppliers();
  }

  @Post('suppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear proveedor (Solo Admin)' })
  createSupplier(@Body() body: any) {
    return this.catalogService.createSupplier(body);
  }

  @Get('products')
  @ApiOperation({ summary: 'Consultar catálogo de prendas con filtros y disponibilidad' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'featured', type: Boolean, required: false })
  @ApiQuery({ name: 'branchId', required: false, description: 'ID de sucursal para consultar stock local' })
  getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('seasonId') seasonId?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: boolean,
    @Query('branchId') branchId?: string,
  ) {
    return this.catalogService.getProducts({
      categoryId,
      seasonId,
      search,
      featured: featured !== undefined ? String(featured) === 'true' : undefined,
      branchId,
    });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Consultar detalle de prenda con disponibilidad en todas las sucursales' })
  @ApiQuery({ name: 'branchId', required: false })
  getProductById(@Param('id') id: string, @Query('branchId') branchId?: string) {
    return this.catalogService.getProductById(id, branchId);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear producto con variantes de talla/color (Admin o Proveedor)' })
  createProduct(@Body() body: any) {
    return this.catalogService.createProduct(body);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar prenda (Solo Admin)' })
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateProduct(id, body);
  }
}
