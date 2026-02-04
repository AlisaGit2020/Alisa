import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class TaxCalculateInputDto {
  @IsOptional()
  @IsInt()
  propertyId?: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
