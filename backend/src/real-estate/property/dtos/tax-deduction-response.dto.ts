import { TaxDeductionMetadata, TaxDeductionType, taxDeductionTypeNames } from '@asset-backend/common/types';

export class TaxDeductionDto {
  id: number;
  propertyId: number;
  year: number;
  deductionType: TaxDeductionType;
  typeName: string;
  description: string | null;
  amount: number;
  metadata: TaxDeductionMetadata | null;

  static fromEntity(entity: {
    id: number;
    propertyId: number;
    year: number;
    deductionType: TaxDeductionType;
    description: string | null;
    amount: number;
    metadata: TaxDeductionMetadata | null;
  }): TaxDeductionDto {
    const dto = new TaxDeductionDto();
    dto.id = entity.id;
    dto.propertyId = entity.propertyId;
    dto.year = entity.year;
    dto.deductionType = entity.deductionType;
    dto.typeName = taxDeductionTypeNames.get(entity.deductionType) ?? 'custom';
    dto.description = entity.description;
    dto.amount = entity.amount;
    dto.metadata = entity.metadata;
    return dto;
  }
}

export class TaxDeductionCalculationDto {
  propertyId: number;
  propertyName: string;
  year: number;
  visits: number;
  distanceKm: number | null;
  ratePerKm: number;
  defaultLaundryPrice: number;
  travelAmount: number;
  laundryAmount: number;
}
