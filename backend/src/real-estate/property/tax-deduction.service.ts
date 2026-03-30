import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxDeduction } from './entities/tax-deduction.entity';
import { PropertyService } from './property.service';
import { PropertyStatisticsService } from './property-statistics.service';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxDeductionInputDto } from './dtos/tax-deduction-input.dto';
import { TaxDeductionDto, TaxDeductionCalculationDto } from './dtos/tax-deduction-response.dto';
import { StatisticKey } from '@asset-backend/common/types';
import {
  getTravelCompensationRate,
  DEFAULT_LAUNDRY_PRICE,
} from './travel-compensation-rates';

@Injectable()
export class TaxDeductionService {
  constructor(
    @InjectRepository(TaxDeduction)
    private repository: Repository<TaxDeduction>,
    private propertyService: PropertyService,
    private statisticsService: PropertyStatisticsService,
  ) {}

  async findByPropertyAndYear(
    user: JWTUser,
    propertyId: number,
    year: number,
  ): Promise<TaxDeductionDto[]> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const deductions = await this.repository.find({
      where: { propertyId, year },
      order: { id: 'ASC' },
    });

    return deductions.map(TaxDeductionDto.fromEntity);
  }

  async findAllForYear(
    user: JWTUser,
    year: number,
    propertyId?: number,
  ): Promise<TaxDeductionDto[]> {
    if (propertyId) {
      return this.findByPropertyAndYear(user, propertyId, year);
    }

    const properties = await this.propertyService.search(user, { select: ['id'] });
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return [];
    }

    const deductions = await this.repository
      .createQueryBuilder('td')
      .where('td.propertyId IN (:...propertyIds)', { propertyIds })
      .andWhere('td.year = :year', { year })
      .orderBy('td.id', 'ASC')
      .getMany();

    return deductions.map(TaxDeductionDto.fromEntity);
  }

  async getCalculationPreview(
    user: JWTUser,
    propertyId: number,
    year: number,
  ): Promise<TaxDeductionCalculationDto> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const visits = await this.getAirbnbVisits(propertyId, year);
    const ratePerKm = getTravelCompensationRate(year);
    const distanceKm = property.distanceFromHome ?? null;

    const travelAmount = distanceKm
      ? this.calculateTravelDeduction(distanceKm, visits, year).amount
      : 0;
    const laundryAmount = this.calculateLaundryDeduction(visits).amount;

    return {
      propertyId,
      propertyName: property.name,
      year,
      visits,
      distanceKm,
      ratePerKm,
      defaultLaundryPrice: DEFAULT_LAUNDRY_PRICE,
      travelAmount,
      laundryAmount,
    };
  }

  async create(user: JWTUser, input: TaxDeductionInputDto): Promise<TaxDeductionDto> {
    const property = await this.propertyService.findOne(user, input.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    const entity = this.repository.create({
      propertyId: input.propertyId,
      year: input.year,
      deductionType: input.deductionType,
      description: input.description ?? null,
      amount: input.amount,
      metadata: input.metadata ?? null,
    });

    const saved = await this.repository.save(entity);
    return TaxDeductionDto.fromEntity(saved);
  }

  async update(
    user: JWTUser,
    id: number,
    input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tax deduction not found');
    }

    const property = await this.propertyService.findOne(user, existing.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    existing.description = input.description ?? null;
    existing.amount = input.amount;
    existing.metadata = input.metadata ?? null;

    const saved = await this.repository.save(existing);
    return TaxDeductionDto.fromEntity(saved);
  }

  async delete(user: JWTUser, id: number): Promise<void> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tax deduction not found');
    }

    const property = await this.propertyService.findOne(user, existing.propertyId);
    if (!property) {
      throw new ForbiddenException('Property not found or not owned by user');
    }

    await this.repository.delete(id);
  }

  async getAirbnbVisits(propertyId: number, year: number): Promise<number> {
    const stats = await this.statisticsService.searchAll(
      { id: 0, email: '' } as JWTUser,
      {
        propertyId,
        key: StatisticKey.AIRBNB_VISITS,
        year,
      },
    );

    const yearlyStat = stats.find((s) => s.month === null);
    return yearlyStat ? parseInt(yearlyStat.value, 10) || 0 : 0;
  }

  calculateTravelDeduction(
    distanceKm: number,
    visits: number,
    year: number,
  ): { amount: number; ratePerKm: number } {
    const ratePerKm = getTravelCompensationRate(year);
    const roundTripKm = distanceKm * 2;
    const amount = roundTripKm * visits * ratePerKm;
    return { amount: Math.round(amount * 100) / 100, ratePerKm };
  }

  calculateLaundryDeduction(
    visits: number,
    pricePerLaundry?: number,
  ): { amount: number; pricePerLaundry: number } {
    const price = pricePerLaundry ?? DEFAULT_LAUNDRY_PRICE;
    const amount = visits * price;
    return { amount: Math.round(amount * 100) / 100, pricePerLaundry: price };
  }
}
