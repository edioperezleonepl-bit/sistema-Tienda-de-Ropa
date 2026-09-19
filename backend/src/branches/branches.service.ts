import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch, City } from '../entities/branch.entity.js';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  async findAllCities() {
    return this.cityRepo.find({ relations: { branches: true } });
  }

  async createCity(name: string, department?: string) {
    const city = this.cityRepo.create({ name, department });
    return this.cityRepo.save(city);
  }

  async findAllBranches() {
    return this.branchRepo.find({ relations: { city: true }, order: { name: 'ASC' } });
  }

  async findOneBranch(id: string) {
    const branch = await this.branchRepo.findOne({
      where: { id },
      relations: { city: true },
    });
    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }
    return branch;
  }

  async createBranch(data: Partial<Branch>) {
    const branch = this.branchRepo.create(data);
    return this.branchRepo.save(branch);
  }

  async updateBranch(id: string, data: Partial<Branch>) {
    await this.findOneBranch(id);
    await this.branchRepo.update(id, data);
    return this.findOneBranch(id);
  }
}
