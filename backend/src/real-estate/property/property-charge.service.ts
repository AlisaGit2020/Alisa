import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PropertyCharge } from './entities/property-charge.entity';
import { PropertyService } from './property.service';
import { PropertyChargeInputDto, PropertyChargeUpdateDto } from './dtos/property-charge-input.dto';
import { PropertyChargeDto, CurrentChargesDto } from './dtos/property-charge-response.dto';
import { ChargeType } from '@asset-backend/common/types';
import { JWTUser } from '@asset-backend/auth/types';

@Injectable()
export class PropertyChargeService {
  constructor(
    @InjectRepository(PropertyCharge)
    private repository: Repository<PropertyCharge>,
    private propertyService: PropertyService,
  ) {}

  async findByProperty(user: JWTUser, propertyId: number): Promise<PropertyChargeDto[]> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const charges = await this.repository.find({
      where: { propertyId },
      order: { chargeType: 'ASC', endDate: { direction: 'DESC', nulls: 'FIRST' } },
    });

    return charges.map(PropertyChargeDto.fromEntity);
  }

  async getCurrentCharges(user: JWTUser, propertyId: number): Promise<CurrentChargesDto> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get charges where (startDate IS NULL OR startDate <= today) AND (endDate IS NULL OR endDate >= today)
    const charges = await this.repository
      .createQueryBuilder('charge')
      .where('charge.propertyId = :propertyId', { propertyId })
      .andWhere('(charge.startDate IS NULL OR charge.startDate <= :today)', { today })
      .andWhere('(charge.endDate IS NULL OR charge.endDate >= :today)', { today })
      .getMany();

    // Map charges to CurrentChargesDto
    const result: CurrentChargesDto = {
      maintenanceFee: null,
      financialCharge: null,
      waterPrepayment: null,
      totalCharge: null,
      otherChargeBased: null,
    };

    for (const charge of charges) {
      switch (charge.chargeType) {
        case ChargeType.MAINTENANCE_FEE:
          result.maintenanceFee = charge.amount;
          break;
        case ChargeType.FINANCIAL_CHARGE:
          result.financialCharge = charge.amount;
          break;
        case ChargeType.WATER_PREPAYMENT:
          result.waterPrepayment = charge.amount;
          break;
        case ChargeType.OTHER_CHARGE_BASED:
          result.otherChargeBased = charge.amount;
          break;
        // Total is calculated from components below
      }
    }

    // Calculate totalCharge from components (not stored in DB)
    result.totalCharge =
      (result.maintenanceFee ?? 0) +
      (result.financialCharge ?? 0) +
      (result.waterPrepayment ?? 0) +
      (result.otherChargeBased ?? 0);

    return result;
  }

  async getChargesForDate(propertyId: number, date: Date): Promise<PropertyCharge[]> {
    return this.repository
      .createQueryBuilder('charge')
      .where('charge.propertyId = :propertyId', { propertyId })
      .andWhere('(charge.startDate IS NULL OR charge.startDate <= :date)', { date })
      .andWhere('(charge.endDate IS NULL OR charge.endDate >= :date)', { date })
      .getMany();
  }

  async create(user: JWTUser, input: PropertyChargeInputDto): Promise<PropertyChargeDto> {
    const property = await this.propertyService.findOne(user, input.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;

    // Auto-close previous open charge of same type
    if (startDate) {
      await this.closeOpenCharges(input.propertyId, input.chargeType, startDate);
    }

    // Create the new charge
    const charge = this.repository.create({
      propertyId: input.propertyId,
      chargeType: input.chargeType,
      amount: input.amount,
      startDate,
      endDate: input.endDate ? new Date(input.endDate) : null,
    });

    const savedCharge = await this.repository.save(charge);

    return PropertyChargeDto.fromEntity(savedCharge);
  }

  async createBatch(
    user: JWTUser,
    propertyId: number,
    inputs: PropertyChargeInputDto[],
  ): Promise<PropertyChargeDto[]> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const results: PropertyChargeDto[] = [];
    const startDate = inputs[0]?.startDate ? new Date(inputs[0].startDate) : null;

    if (startDate) {
      // Delete existing charges with the exact same startDate (handles edits)
      await this.repository.delete({
        propertyId,
        startDate,
      });

      // Close all existing open charges in a single batch update
      await this.closeAllOpenCharges(propertyId, startDate);
    }

    for (const input of inputs) {
      // Skip if amount is not provided (but allow 0 amounts)
      if (input.amount === null || input.amount === undefined) {
        continue;
      }

      const charge = this.repository.create({
        propertyId,
        chargeType: input.chargeType,
        amount: input.amount,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      });

      const savedCharge = await this.repository.save(charge);
      results.push(PropertyChargeDto.fromEntity(savedCharge));
    }

    return results;
  }

  async update(
    user: JWTUser,
    propertyId: number,
    chargeId: number,
    input: PropertyChargeUpdateDto,
  ): Promise<PropertyChargeDto> {
    // Validate ownership
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const charge = await this.repository.findOne({
      where: { id: chargeId, propertyId },
    });

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    // Update fields
    if (input.amount !== undefined) {
      charge.amount = input.amount;
    }
    if (input.startDate !== undefined) {
      charge.startDate = new Date(input.startDate);
    }
    if (input.endDate !== undefined) {
      charge.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    const savedCharge = await this.repository.save(charge);

    return PropertyChargeDto.fromEntity(savedCharge);
  }

  async delete(user: JWTUser, propertyId: number, chargeId: number): Promise<void> {
    // Validate ownership
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const charge = await this.repository.findOne({
      where: { id: chargeId, propertyId },
    });

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    await this.repository.delete(chargeId);
  }

  async getChargeHistory(
    user: JWTUser,
    propertyId: number,
    chargeType: ChargeType,
  ): Promise<PropertyChargeDto[]> {
    const property = await this.propertyService.findOne(user, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const charges = await this.repository.find({
      where: { propertyId, chargeType },
      order: { startDate: 'DESC' },
    });

    return charges.map(PropertyChargeDto.fromEntity);
  }

  private async closeOpenCharges(
    propertyId: number,
    chargeType: ChargeType,
    newStartDate: Date,
  ): Promise<void> {
    // Find open charges of the same type (endDate is null)
    const openCharges = await this.repository.find({
      where: {
        propertyId,
        chargeType,
        endDate: IsNull(),
      },
    });

    // Set endDate to day before new charge starts
    const dayBefore = new Date(newStartDate);
    dayBefore.setDate(dayBefore.getDate() - 1);

    for (const charge of openCharges) {
      charge.endDate = dayBefore;
      await this.repository.save(charge);
    }
  }

  private async closeAllOpenCharges(
    propertyId: number,
    newStartDate: Date,
  ): Promise<void> {
    // Set endDate to day before new charge starts
    const dayBefore = new Date(newStartDate);
    dayBefore.setDate(dayBefore.getDate() - 1);

    // Close all open charges in a single batch update (avoids N+1)
    await this.repository
      .createQueryBuilder()
      .update(PropertyCharge)
      .set({ endDate: dayBefore })
      .where('propertyId = :propertyId', { propertyId })
      .andWhere('endDate IS NULL')
      .andWhere('startDate < :newStartDate', { newStartDate })
      .execute();
  }

}
