import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../entities/user.entity.js';
import { MovementType } from '../entities/inventory.entity.js';

@ApiTags('Inventario y Stock')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('branch/:branchId')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Consultar inventario de una sucursal específica' })
  getBranchStock(@Param('branchId') branchId: string) {
    return this.inventoryService.getBranchStock(branchId);
  }

  @Get('consolidated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consultar inventario global consolidado de todas las sucursales (Solo Admin)' })
  getGlobalConsolidated() {
    return this.inventoryService.getGlobalConsolidatedInventory();
  }

  @Get('movements')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Consultar historial de movimientos (Kardex)' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'variantId', required: false })
  getMovements(@Query('branchId') branchId?: string, @Query('variantId') variantId?: string) {
    return this.inventoryService.getMovements({ branchId, variantId });
  }

  @Post('movements')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Registrar movimiento de inventario (Entrada de proveedor, ajuste o traspaso)' })
  registerMovement(
    @Body()
    body: {
      branchId: string;
      variantId: string;
      movementType: MovementType;
      quantity: number;
      referenceCode?: string;
      notes?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.registerMovement({
      ...body,
      userId: user.id,
    });
  }
}
