import { TransactionType } from '@asset-backend/common/types';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PropertyTransactionSearchDto {
  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  month?: number;

  @IsOptional()
  type?: TransactionType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  take?: number;
}
