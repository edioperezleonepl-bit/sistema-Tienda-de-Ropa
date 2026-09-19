import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FittingReservation,
  ReservationItem,
  ReservationStatus,
} from '../entities/reservation.entity.js';
import { BranchInventory, MovementType } from '../entities/inventory.entity.js';
import { InventoryService } from '../inventory/inventory.service.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(FittingReservation)
    private readonly reservationRepo: Repository<FittingReservation>,
    @InjectRepository(ReservationItem)
    private readonly itemRepo: Repository<ReservationItem>,
    @InjectRepository(BranchInventory)
    private readonly inventoryRepo: Repository<BranchInventory>,
    private readonly inventoryService: InventoryService,
  ) {}

  async createReservation(data: {
    clientId: string;
    branchId: string;
    reservationDate: string;
    timeSlot: string;
    notes?: string;
    items: { variantId: string; quantity?: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una prenda para la reserva');
    }

    // Verificar stock disponible en la sucursal seleccionada
    for (const item of data.items) {
      const qty = item.quantity || 1;
      const inv = await this.inventoryRepo.findOne({
        where: { branchId: data.branchId, variantId: item.variantId },
      });
      if (!inv || inv.stockQuantity < qty) {
        throw new BadRequestException(
          `Una de las prendas seleccionadas no cuenta con stock disponible en esta sucursal`,
        );
      }
    }

    // Generar código de reserva secuencial/único
    const count = await this.reservationRepo.count();
    const reservationCode = `RES-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const reservation = this.reservationRepo.create({
      reservationCode,
      clientId: data.clientId,
      branchId: data.branchId,
      reservationDate: data.reservationDate,
      timeSlot: data.timeSlot,
      notes: data.notes,
      status: ReservationStatus.PENDING,
    });

    const savedReservation = await this.reservationRepo.save(reservation);

    // Guardar items y apartar temporalmente el stock (RESERVE_HOLD)
    for (const item of data.items) {
      const qty = item.quantity || 1;
      const resItem = this.itemRepo.create({
        reservationId: savedReservation.id,
        variantId: item.variantId,
        quantity: qty,
        isPrepared: false,
      });
      await this.itemRepo.save(resItem);

      await this.inventoryService.registerMovement({
        branchId: data.branchId,
        variantId: item.variantId,
        movementType: MovementType.RESERVE_HOLD,
        quantity: qty,
        referenceCode: reservationCode,
        notes: `Reserva vestidor físico ${reservationCode}`,
        userId: data.clientId,
      });
    }

    return this.findOne(savedReservation.id);
  }

  async findOne(id: string) {
    const res = await this.reservationRepo.findOne({
      where: { id },
      relations: {
        client: true,
        branch: { city: true },
        items: { variant: { product: true } },
      },
    });
    if (!res) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return res;
  }

  async findByCode(code: string) {
    const res = await this.reservationRepo.findOne({
      where: { reservationCode: code },
      relations: {
        client: true,
        branch: { city: true },
        items: { variant: { product: true } },
      },
    });
    if (!res) {
      throw new NotFoundException(`No se encontró la reserva con código ${code}`);
    }
    return res;
  }

  async findClientReservations(clientId: string) {
    return this.reservationRepo.find({
      where: { clientId },
      relations: {
        branch: { city: true },
        items: { variant: { product: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findBranchReservations(branchId: string, status?: ReservationStatus) {
    const query = this.reservationRepo
      .createQueryBuilder('res')
      .leftJoinAndSelect('res.client', 'client')
      .leftJoinAndSelect('res.branch', 'branch')
      .leftJoinAndSelect('res.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('res.branchId = :branchId', { branchId });

    if (status) {
      query.andWhere('res.status = :status', { status });
    }

    return query.orderBy('res.reservationDate', 'ASC').addOrderBy('res.timeSlot', 'ASC').getMany();
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
    fittingRoomNumber?: number,
  ) {
    const res = await this.findOne(id);
    const oldStatus = res.status;

    res.status = status;
    if (fittingRoomNumber) {
      res.assignedFittingRoom = fittingRoomNumber;
    }

    // Si se cancela la reserva, liberar el stock reservado (RESERVE_RELEASE)
    if (status === ReservationStatus.CANCELLED && oldStatus !== ReservationStatus.CANCELLED) {
      for (const item of res.items) {
        await this.inventoryService.registerMovement({
          branchId: res.branchId,
          variantId: item.variantId,
          movementType: MovementType.RESERVE_RELEASE,
          quantity: item.quantity,
          referenceCode: res.reservationCode,
          notes: `Liberación por cancelación de reserva ${res.reservationCode}`,
        });
      }
    }

    // Si se marca como atendido/completado sin compra digital
    if (status === ReservationStatus.COMPLETED && oldStatus !== ReservationStatus.COMPLETED) {
      // Si no se compraron las prendas en el acto, se liberan al stock general
      for (const item of res.items) {
        await this.inventoryService.registerMovement({
          branchId: res.branchId,
          variantId: item.variantId,
          movementType: MovementType.RESERVE_RELEASE,
          quantity: item.quantity,
          referenceCode: res.reservationCode,
          notes: `Liberación post-prueba en probador ${res.reservationCode}`,
        });
      }
    }

    await this.reservationRepo.save(res);
    return this.findOne(id);
  }

  async markItemPrepared(itemId: string, isPrepared: boolean) {
    await this.itemRepo.update(itemId, { isPrepared });
    return { success: true, isPrepared };
  }
}
