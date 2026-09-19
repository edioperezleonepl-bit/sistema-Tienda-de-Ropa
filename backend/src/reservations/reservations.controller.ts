import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../entities/user.entity.js';
import { ReservationStatus } from '../entities/reservation.entity.js';

@ApiTags('Reservas de Vestidores Físicos')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reserva para probar prendas en una sucursal' })
  create(
    @Body()
    body: {
      branchId: string;
      reservationDate: string;
      timeSlot: string;
      notes?: string;
      items: { variantId: string; quantity?: number }[];
    },
    @CurrentUser() user: User,
  ) {
    return this.reservationsService.createReservation({
      ...body,
      clientId: user.id,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Obtener historial de reservas del cliente autenticado' })
  getMyReservations(@CurrentUser() user: User) {
    return this.reservationsService.findClientReservations(user.id);
  }

  @Get('branch/:branchId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Listar reservas de una sucursal para el encargado' })
  @ApiQuery({ name: 'status', enum: ReservationStatus, required: false })
  getBranchReservations(
    @Param('branchId') branchId: string,
    @Query('status') status?: ReservationStatus,
  ) {
    return this.reservationsService.findBranchReservations(branchId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de una reserva por ID' })
  getById(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Consultar reserva por código (ej: RES-2026-00001)' })
  getByCode(@Param('code') code: string) {
    return this.reservationsService.findByCode(code);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de la reserva (Preparado, En probador, Cancelado, Completado)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ReservationStatus; fittingRoomNumber?: number },
  ) {
    return this.reservationsService.updateStatus(id, body.status, body.fittingRoomNumber);
  }

  @Patch('items/:itemId/prepared')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Marcar prenda como preparada en el perchero' })
  markPrepared(
    @Param('itemId') itemId: string,
    @Body() body: { isPrepared: boolean },
  ) {
    return this.reservationsService.markItemPrepared(itemId, body.isPrepared);
  }
}
