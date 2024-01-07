import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { validate, validateOrReject } from 'class-validator';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) { }

  async findAll(): Promise<Property[]> {
    return this.propertyRepository.find();
  }

  async findOne(id: number): Promise<Property> {
    return this.propertyRepository.findOneBy({ id: id });
  }

  async add(
    input: PropertyInputDto,
  ): Promise<Property> {

    const propertyEntity = new Property();

    this.mapData(propertyEntity, input);

    return await this.propertyRepository.save(propertyEntity);
  }

  async update(
    id: number,
    input: PropertyInputDto,
  ): Promise<Property> {

    const propertyEntity = await this.findOne(id);

    this.mapData(propertyEntity, input);

    await this.propertyRepository.save(propertyEntity);
    return propertyEntity;
  }

  async delete(id: number): Promise<void> {
    await this.propertyRepository.delete(id);
  }

  private mapData(property: Property, input: PropertyInputDto) {
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        property[key] = value;
      }
    });
  }
}
