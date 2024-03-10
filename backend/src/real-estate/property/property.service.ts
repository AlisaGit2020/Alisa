import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { AuthService } from '@alisa-backend/auth/auth.service';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private repository: Repository<Property>,
    private authService: AuthService,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Property>,
  ): Promise<Property[]> {
    await this.validate(user, options);
    options = this.handleOptions(user, options);

    return this.repository.find(options);
  }

  async findOne(user: JWTUser, id: number): Promise<Property> {
    const property = await this.repository.findOneBy({ id: id });
    if (!property) {
      return null;
    }

    if (!(await this.authService.hasOwnership(user, id))) {
      throw new UnauthorizedException();
    }
    return property;
  }

  async add(user: JWTUser, input: PropertyInputDto): Promise<Property> {
    const propertyEntity = new Property();

    if (input.ownerships === undefined) {
      const ownership = new OwnershipInputDto();
      ownership.share = 100;
      input.ownerships = [ownership];
    }
    this.mapData(user, propertyEntity, input);
    return this.repository.save(propertyEntity);
  }

  async update(
    user: JWTUser,
    id: number,
    input: PropertyInputDto,
  ): Promise<Property> {
    const propertyEntity = await this.getEntityOrThrow(user, id);

    this.mapData(user, propertyEntity, input);

    await this.repository.save(propertyEntity);
    return propertyEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    await this.getEntityOrThrow(user, id);
    await this.repository.delete(id);
  }

  private mapData(user: JWTUser, property: Property, input: PropertyInputDto) {
    if (input.ownerships !== undefined) {
      input?.ownerships.forEach((ownership) => {
        ownership.userId = user.id;
      });
    }
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        property[key] = value;
      }
    });
  }

  private async validate(
    user: JWTUser,
    options: FindManyOptions,
  ): Promise<void> {
    const propertyIdInQuery = this.getPropertyIdFromQuery(options);
    if (propertyIdInQuery === undefined) {
      return;
    }
    await this.getEntityOrThrow(user, propertyIdInQuery);
  }

  private async getEntityOrThrow(user: JWTUser, id: number): Promise<Property> {
    const entity = await this.findOne(user, id);
    if (!entity) {
      throw new NotFoundException();
    }
    if (!(await this.authService.hasOwnership(user, id))) {
      throw new UnauthorizedException();
    }
    return entity;
  }

  private handleOptions(
    user: JWTUser,
    options: FindManyOptions<Property>,
  ): FindManyOptions {
    const propertyIdInQuery = this.getPropertyIdFromQuery(options);

    if (propertyIdInQuery !== undefined) {
      return options;
    }

    if (options.where === undefined) {
      options.where = {} as FindOptionsWhere<Property>;
    }
    if (options.where['ownerships'] === undefined) {
      options.where['ownerships'] = [];
    }
    options.where['ownerships']['userId'] = In([user.id]);
    return options;
  }

  private getPropertyIdFromQuery(options: FindManyOptions): undefined | number {
    if (options.where === undefined) {
      return undefined;
    }
    return options.where['id'];
  }
}
