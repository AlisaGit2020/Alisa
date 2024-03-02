import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { OwnershipService } from '@alisa-backend/people/ownership/ownership.service';

@Injectable()
export class PropertyService {
  constructor(
    private ownershipService: OwnershipService,
    @InjectRepository(Property)
    private repository: Repository<Property>,
  ) {}

  async search(options: FindManyOptions<Property>): Promise<Property[]> {
    return this.repository.find(options);
  }

  async findAll(): Promise<Property[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<Property> {
    return this.repository.findOneBy({ id: id });
  }

  async add(input: PropertyInputDto): Promise<Property> {
    const propertyEntity = new Property();

    this.mapData(propertyEntity, input);
    return this.repository.save(propertyEntity);
  }

  async update(id: number, input: PropertyInputDto): Promise<Property> {
    const propertyEntity = await this.findOne(id);

    this.mapData(propertyEntity, input);

    await this.repository.save(propertyEntity);
    return propertyEntity;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  private mapData(property: Property, input: PropertyInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        property[key] = value;
      }
    });
  }
}
