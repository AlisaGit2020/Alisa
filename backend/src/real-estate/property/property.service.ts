import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import type { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Property } from './entities/property.entity';
import { PropertyInputDto } from './dtos/property-input.dto';
import { Address } from '@asset-backend/real-estate/address/entities/address.entity';
import { JWTUser } from '@asset-backend/auth/types';
import { OwnershipInputDto } from '@asset-backend/people/ownership/dtos/ownership-input.dto';
import { AuthService } from '@asset-backend/auth/auth.service';
import { Ownership } from '@asset-backend/people/ownership/entities/ownership.entity';
import { TierService } from '@asset-backend/admin/tier.service';
import { Transaction } from '@asset-backend/accounting/transaction/entities/transaction.entity';
import { Expense } from '@asset-backend/accounting/expense/entities/expense.entity';
import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { DepreciationAsset } from '@asset-backend/accounting/depreciation/entities/depreciation-asset.entity';
import {
  PropertyDeleteValidationDto,
  DependencyGroup,
  DependencyItem,
  DependencyType,
} from './dtos/property-delete-validation.dto';
import { PropertyTransactionSearchDto } from './dtos/property-transaction-search.dto';
import { TransactionStatus } from '@asset-backend/common/types';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

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
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
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

  async searchTransactions(
    user: JWTUser,
    propertyId: number,
    filter: PropertyTransactionSearchDto,
  ): Promise<Transaction[]> {
    // Validate user ownership
    await this.getEntityOrThrow(user, propertyId);

    // Build where clause
    const where: FindOptionsWhere<Transaction> = {
      propertyId,
      status: TransactionStatus.ACCEPTED,
    };

    // Filter by year and month using transactionDate
    if (filter.year && filter.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
      where.transactionDate = Between(startDate, endDate);
    } else if (filter.year) {
      const startDate = new Date(filter.year, 0, 1);
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59);
      where.transactionDate = Between(startDate, endDate);
    }

    if (filter.type) {
      where.type = filter.type;
    }

    return this.transactionRepository.find({
      where,
      relations: {
        expenses: { expenseType: true },
        incomes: { incomeType: true },
      },
      order: { transactionDate: 'DESC' },
      skip: filter.skip,
      take: filter.take,
    });
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
    const property = await this.getEntityOrThrow(user, id);
    const addressId = property.addressId;
    const photoPath = property.photo;

    // Use a transaction to ensure property and address are deleted atomically
    await this.repository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.remove(property);
      if (addressId) {
        await transactionalEntityManager.delete(Address, addressId);
      }
    });

    // Delete photo file after successful database deletion
    if (photoPath) {
      await this.deletePhotoFile(photoPath);
    }
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
    const hasDependencies = dependencies.length > 0;

    return {
      validation: {
        canDelete: true, // Always allow - cascade handles deletion
        dependencies,
        message: hasDependencies
          ? 'The following related data will be deleted with the property'
          : undefined,
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

    // Handle nested address object (check both undefined and null)
    if (input.address !== undefined && input.address !== null) {
      if (
        input.address.street ||
        input.address.city ||
        input.address.postalCode
      ) {
        const address = new Address();
        if (property.address?.id) {
          address.id = property.address.id;
        }
        address.street = input.address.street;
        address.city = input.address.city;
        address.postalCode = input.address.postalCode;
        property.address = address;
      } else {
        // All address fields are empty, remove the address
        property.address = undefined;
      }
    }

    // Explicit property mapping to prevent mass assignment vulnerabilities
    if (input.name !== undefined) property.name = input.name;
    if (input.size !== undefined) property.size = input.size;
    if (input.photo !== undefined) property.photo = input.photo;
    if (input.description !== undefined) property.description = input.description;
    if (input.buildYear !== undefined) property.buildYear = input.buildYear;
    if (input.apartmentType !== undefined)
      property.apartmentType = input.apartmentType;
    if (input.status !== undefined) property.status = input.status;
    if (input.externalSource !== undefined)
      property.externalSource = input.externalSource;
    if (input.externalSourceId !== undefined)
      property.externalSourceId = input.externalSourceId;
    if (input.ownerships !== undefined)
      property.ownerships = input.ownerships as unknown as Ownership[];
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
      // Validate path to prevent path traversal attacks
      const normalizedPath = path.resolve(photoPath);
      const uploadDir = path.resolve('./uploads/properties');

      if (!normalizedPath.startsWith(uploadDir)) {
        this.logger.warn(
          `Attempted path traversal attack detected: ${photoPath}`,
        );
        throw new BadRequestException('Invalid file path');
      }

      await fs.promises.unlink(normalizedPath);
    } catch (error) {
      // Log but don't throw - file may have been deleted already
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(
        `Failed to delete photo file: ${photoPath}`,
        error.message,
      );
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
