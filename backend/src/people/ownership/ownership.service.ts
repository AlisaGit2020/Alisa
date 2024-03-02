import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Ownership } from './entities/ownership.entity';
import { OwnershipInputDto } from './dtos/ownership-input.dto';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectRepository(Ownership)
    private repository: Repository<Ownership>,
  ) {}

  async search(options: FindManyOptions<Ownership>): Promise<Ownership[]> {
    return this.repository.find(options);
  }

  async findAll(): Promise<Ownership[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Ownership> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: OwnershipInputDto): Promise<Ownership> {
    const ownershipEntity = new Ownership();

    this.mapData(ownershipEntity, input);

    return await this.repository.save(ownershipEntity);
  }

  async update(id: number, input: OwnershipInputDto): Promise<Ownership> {
    const ownershipEntity = await this.findOne(id);

    this.mapData(ownershipEntity, input);

    await this.repository.save(ownershipEntity);
    return ownershipEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private mapData(ownership: Ownership, input: OwnershipInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        ownership[key] = value;
      }
    });
  }
}
