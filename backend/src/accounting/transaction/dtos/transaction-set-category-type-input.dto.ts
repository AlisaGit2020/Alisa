import {
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class TransactionSetCategoryTypeInputDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  ids: number[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  expenseTypeId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  incomeTypeId?: number;
}
