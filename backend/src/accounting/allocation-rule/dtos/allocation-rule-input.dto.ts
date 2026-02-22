import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@alisa-backend/common/types';

export class AllocationConditionInputDto {
  @IsString()
  @IsNotEmpty()
  field: 'sender' | 'receiver' | 'description' | 'amount';

  @IsString()
  @IsNotEmpty()
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class AllocationRuleInputDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  propertyId: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsOptional()
  @IsNumber()
  expenseTypeId?: number | null;

  @IsOptional()
  @IsNumber()
  incomeTypeId?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationConditionInputDto)
  conditions: AllocationConditionInputDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
