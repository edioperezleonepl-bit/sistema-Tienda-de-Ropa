import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { Branch } from '../entities/branch.entity.js';

@ApiTags('Sucursales y Ciudades')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las sucursales disponibles (Público)' })
  async findAllBranches() {
    return this.branchesService.findAllBranches();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Listar todas las ciudades con sus sucursales (Público)' })
  async findAllCities() {
    return this.branchesService.findAllCities();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una sucursal por ID' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOneBranch(id);
  }

  @Post('cities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva ciudad (Solo Admin)' })
  async createCity(@Body() body: { name: string; department?: string }) {
    return this.branchesService.createCity(body.name, body.department);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una nueva sucursal (Solo Admin)' })
  async createBranch(@Body() data: Partial<Branch>) {
    return this.branchesService.createBranch(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modificar datos de sucursal (Solo Admin)' })
  async updateBranch(@Param('id') id: string, @Body() data: Partial<Branch>) {
    return this.branchesService.updateBranch(id, data);
  }
}
