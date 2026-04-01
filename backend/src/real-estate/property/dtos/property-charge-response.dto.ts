import { ChargeType, chargeTypeNames } from '@asset-backend/common/types';
import { PropertyCharge } from '../entities/property-charge.entity';

export class PropertyChargeDto {
  id: number;
  propertyId: number;
  chargeType: ChargeType;
  typeName: string;
  amount: number;
  startDate: string;
  endDate: string | null;

  static fromEntity(entity: PropertyCharge): PropertyChargeDto {
    const startDate = entity.startDate instanceof Date
      ? entity.startDate.toISOString().split('T')[0]
      : String(entity.startDate);
    const endDate = entity.endDate
      ? (entity.endDate instanceof Date
          ? entity.endDate.toISOString().split('T')[0]
          : String(entity.endDate))
      : null;

    return {
      id: entity.id,
      propertyId: entity.propertyId,
      chargeType: entity.chargeType,
      typeName: chargeTypeNames.get(entity.chargeType) || 'unknown',
      amount: entity.amount,
      startDate,
      endDate,
    };
  }
}

export interface CurrentChargesDto {
  maintenanceFee: number | null;
  financialCharge: number | null;
  waterPrepayment: number | null;
  totalCharge: number | null;
}
