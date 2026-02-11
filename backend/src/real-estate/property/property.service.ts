import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import type { Express } from 'express';
import * as fs from 'fs';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { TierService } from '@alisa-backend/admin/tier.service';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';
import { Income } from '@alisa-backend/accounting/income/entities/income.entity';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { DepreciationAsset } from '@alisa-backend/accounting/depreciation/entities/depreciation-asset.entity';
import {
  PropertyDeleteValidationDto,
  DependencyGroup,
  DependencyItem,
  DependencyType,
} from './dtos/property-delete-validation.dto';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private repository: Repository<Property>,
    @InjectRepository(Ownership)
    private ownershipRepository: Repository<Ownership>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(PropertyStatistics)
    private statisticsRepository: Repository<PropertyStatistics>,
    @InjectRepository(DepreciationAsset)
    private depreciationAssetRepository: Repository<DepreciationAsset>,
    private authService: AuthService,
    private tierService: TierService,
  ) {}

  async search(
    user: JWTUser,
    options: FindManyOptions<Property>,
  ): Promise<Property[]> {
    if (!options) {
      options = {};
    }
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

    if (!input.ownerships || input.ownerships.length === 0) {
      const ownership = new OwnershipInputDto();
      ownership.share = 100;
      input.ownerships = [ownership];
    }

    // Determine the owner: use explicitly provided userId if set, otherwise the logged-in user
    const ownerId = input.ownerships[0]?.userId || user.id;

    const canCreate = await this.tierService.canCreateProperty(ownerId);
    if (!canCreate) {
      throw new ForbiddenException(
        'Property limit reached for your current tier',
      );
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

    // If updating ownerships, delete existing ones first to avoid TypeORM cascade issues
    // with NOT NULL constraint on propertyId when orphaning records
    if (input.ownerships !== undefined) {
      await this.ownershipRepository.delete({ propertyId: id });
    }

    this.mapData(user, propertyEntity, input);

    await this.repository.save(propertyEntity);
    return propertyEntity;
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const { validation, property } = await this.validateDelete(user, id);
    if (!validation.canDelete) {
      throw new BadRequestException(validation);
    }

    if (property.photo) {
      await this.deletePhotoFile(property.photo);
    }
    await this.repository.delete(id);
  }

  async validateDelete(
    user: JWTUser,
    id: number,
  ): Promise<{ validation: PropertyDeleteValidationDto; property: Property }> {
    const property = await this.getEntityOrThrow(user, id);

    const sampleLimit = 5;

    // Run all dependency checks in parallel
    const [
      transactionCount,
      expenseCount,
      incomeCount,
      statisticsCount,
      depreciationCount,
    ] = await Promise.all([
      this.transactionRepository.count({ where: { propertyId: id } }),
      this.expenseRepository.count({ where: { propertyId: id } }),
      this.incomeRepository.count({ where: { propertyId: id } }),
      this.statisticsRepository.count({ where: { propertyId: id } }),
      this.depreciationAssetRepository.count({ where: { propertyId: id } }),
    ]);

    // Fetch samples only for dependencies that exist (in parallel)
    const samplePromises: Promise<DependencyGroup | null>[] = [];

    if (transactionCount > 0) {
      samplePromises.push(
        this.transactionRepository
          .find({ where: { propertyId: id }, take: sampleLimit, order: { id: 'DESC' } })
          .then((samples): DependencyGroup => ({
            type: 'transaction' as DependencyType,
            count: transactionCount,
            samples: samples.map((t): DependencyItem => ({ id: t.id, description: t.description })),
          })),
      );
    }

    if (expenseCount > 0) {
      samplePromises.push(
        this.expenseRepository
          .find({ where: { propertyId: id }, take: sampleLimit, order: { id: 'DESC' } })
          .then((samples): DependencyGroup => ({
            type: 'expense' as DependencyType,
            count: expenseCount,
            samples: samples.map((e): DependencyItem => ({ id: e.id, description: e.description })),
          })),
      );
    }

    if (incomeCount > 0) {
      samplePromises.push(
        this.incomeRepository
          .find({ where: { propertyId: id }, take: sampleLimit, order: { id: 'DESC' } })
          .then((samples): DependencyGroup => ({
            type: 'income' as DependencyType,
            count: incomeCount,
            samples: samples.map((i): DependencyItem => ({ id: i.id, description: i.description })),
          })),
      );
    }

    if (statisticsCount > 0) {
      samplePromises.push(
        this.statisticsRepository
          .find({ where: { propertyId: id }, take: sampleLimit, order: { id: 'DESC' } })
          .then((samples): DependencyGroup => ({
            type: 'statistics' as DependencyType,
            count: statisticsCount,
            samples: samples.map((s): DependencyItem => ({
              id: s.id,
              description: `${s.key} (${s.year ?? 'all'}${s.month ? '-' + s.month : ''})`,
            })),
          })),
      );
    }

    if (depreciationCount > 0) {
      samplePromises.push(
        this.depreciationAssetRepository
          .find({ where: { propertyId: id }, take: sampleLimit, order: { id: 'DESC' } })
          .then((samples): DependencyGroup => ({
            type: 'depreciationAsset' as DependencyType,
            count: depreciationCount,
            samples: samples.map((d): DependencyItem => ({ id: d.id, description: d.description })),
          })),
      );
    }

    const dependencies = await Promise.all(samplePromises);
    const canDelete = dependencies.length === 0;

    return {
      validation: {
        canDelete,
        dependencies,
        message: canDelete
          ? undefined
          : 'Property has related data that must be deleted first',
      },
      property,
    };
  }

  private mapData(user: JWTUser, property: Property, input: PropertyInputDto) {
    if (input.ownerships !== undefined) {
      input?.ownerships.forEach((ownership) => {
        if (!ownership.userId) {
          ownership.userId = user.id;
        }
        // Set propertyId for updates (when property already has an ID)
        if (property.id !== undefined) {
          ownership.propertyId = property.id;
        }
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
      options.where['ownerships'] = { userId: user.id };
    } else {
      options.where['ownerships']['userId'] = user.id;
    }
    return options;
  }

  private getPropertyIdFromQuery(options: FindManyOptions): undefined | number {
    if (options.where === undefined) {
      return undefined;
    }
    return options.where['id'];
  }

  async uploadPhoto(
    user: JWTUser,
    propertyId: number,
    file: Express.Multer.File,
  ): Promise<Property> {
    const property = await this.getEntityOrThrow(user, propertyId);

    this.validatePhotoFile(file);

    if (property.photo) {
      await this.deletePhotoFile(property.photo);
    }

    const relativePath = file.path.replace(/\\/g, '/');
    property.photo = relativePath;
    await this.repository.save(property);

    return property;
  }

  async deletePhoto(user: JWTUser, propertyId: number): Promise<Property> {
    const property = await this.getEntityOrThrow(user, propertyId);

    if (!property.photo) {
      throw new NotFoundException('Property does not have a photo');
    }

    await this.deletePhotoFile(property.photo);
    property.photo = null;
    await this.repository.save(property);

    return property;
  }

  private async deletePhotoFile(photoPath: string): Promise<void> {
    try {
      await fs.promises.unlink(photoPath);
    } catch (error) {
      // Log but don't throw - file may have been deleted already
      console.log(`Failed to delete photo file: ${photoPath}`, error.message);
    }
  }

  private validatePhotoFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File must not be empty');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }
  }
}
