import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole) {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.where('user.role = :role', { role });
    }
    const users = await query.orderBy('user.createdAt', 'DESC').getMany();
    return users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateRoleOrBranch(id: string, role?: UserRole, branchId?: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (role) user.role = role;
    if (branchId !== undefined) user.branchId = branchId || undefined;
    const updated = await this.userRepository.save(user);
    const { passwordHash, ...rest } = updated;
    return rest;
  }

  async createStaff(data: { email: string; password: string; fullName: string; role: UserRole; branchId?: string; phone?: string }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const newUser = this.userRepository.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      branchId: data.branchId,
    });
    const saved = await this.userRepository.save(newUser);
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }
}
