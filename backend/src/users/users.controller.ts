import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';

@ApiTags('Usuarios y Personal')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios con filtro opcional por rol (Solo Admin)' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Post('staff')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear empleado de sucursal, cajero o proveedor (Solo Admin)' })
  async createStaff(
    @Body()
    body: {
      email: string;
      password: string;
      fullName: string;
      role: UserRole;
      branchId?: string;
      phone?: string;
    },
  ) {
    return this.usersService.createStaff(body);
  }

  @Patch(':id/role-branch')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar rol y/o sucursal asignada a un usuario (Solo Admin)' })
  async updateRoleOrBranch(
    @Param('id') id: string,
    @Body() body: { role?: UserRole; branchId?: string },
  ) {
    return this.usersService.updateRoleOrBranch(id, body.role, body.branchId);
  }
}
