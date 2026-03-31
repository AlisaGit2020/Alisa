import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
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
      order: { startDate: 'DESC', chargeType: 'ASC' },
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

    // Get charges where startDate <= today AND (endDate IS NULL OR endDate >= today)
    const charges = await this.repository
      .createQueryBuilder('charge')
      .where('charge.propertyId = :propertyId', { propertyId })
      .andWhere('charge.startDate <= :today', { today })
      .andWhere('(charge.endDate IS NULL OR charge.endDate >= :today)', { today })
      .getMany();

    // Map charges to CurrentChargesDto
    const result: CurrentChargesDto = {
      maintenanceFee: null,
      financialCharge: null,
      waterPrepayment: null,
      totalCharge: null,
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
        case ChargeType.TOTAL_CHARGE:
          result.totalCharge = charge.amount;
          break;
      }
    }

    return result;
  }

  async create(user: JWTUser, input: PropertyChargeInputDto): Promise<PropertyChargeDto> {
    const property = await this.propertyService.findOne(user, input.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const startDate = new Date(input.startDate);

    // Auto-close previous open charge of same type
    await this.closeOpenCharges(input.propertyId, input.chargeType, startDate);

    // Create the new charge
    const charge = this.repository.create({
      propertyId: input.propertyId,
      chargeType: input.chargeType,
      amount: input.amount,
      startDate,
      endDate: input.endDate ? new Date(input.endDate) : null,
    });

    const savedCharge = await this.repository.save(charge);

    // Recalculate TOTAL_CHARGE if this is a component charge
    if (input.chargeType !== ChargeType.TOTAL_CHARGE) {
      await this.recalculateTotalCharge(input.propertyId, startDate);
    }

    return PropertyChargeDto.fromEntity(savedCharge);
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

    // Recalculate TOTAL_CHARGE if this is a component charge
    if (charge.chargeType !== ChargeType.TOTAL_CHARGE) {
      await this.recalculateTotalCharge(propertyId, charge.startDate);
    }

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

    const chargeType = charge.chargeType;
    const startDate = charge.startDate;

    await this.repository.delete(chargeId);

    // Recalculate TOTAL_CHARGE if this was a component charge
    if (chargeType !== ChargeType.TOTAL_CHARGE) {
      await this.recalculateTotalCharge(propertyId, startDate);
    }
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

  private async recalculateTotalCharge(
    propertyId: number,
    asOfDate: Date,
  ): Promise<void> {
    // Get current component charges as of the given date
    const charges = await this.repository
      .createQueryBuilder('charge')
      .where('charge.propertyId = :propertyId', { propertyId })
      .andWhere('charge.chargeType IN (:...types)', {
        types: [
          ChargeType.MAINTENANCE_FEE,
          ChargeType.FINANCIAL_CHARGE,
          ChargeType.WATER_PREPAYMENT,
        ],
      })
      .andWhere('charge.startDate <= :date', { date: asOfDate })
      .andWhere('(charge.endDate IS NULL OR charge.endDate >= :date)', { date: asOfDate })
      .getMany();

    // Calculate total
    let total = 0;
    for (const charge of charges) {
      total += charge.amount;
    }

    // Find or create TOTAL_CHARGE record
    const existingTotal = await this.repository.findOne({
      where: {
        propertyId,
        chargeType: ChargeType.TOTAL_CHARGE,
        endDate: IsNull(),
      },
    });

    if (existingTotal) {
      existingTotal.amount = total;
      existingTotal.startDate = asOfDate;
      await this.repository.save(existingTotal);
    } else {
      const totalCharge = this.repository.create({
        propertyId,
        chargeType: ChargeType.TOTAL_CHARGE,
        amount: total,
        startDate: asOfDate,
        endDate: null,
      });
      await this.repository.save(totalCharge);
    }
  }
}
