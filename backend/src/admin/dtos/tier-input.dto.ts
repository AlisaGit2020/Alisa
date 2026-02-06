import { IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class TierInputDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  maxProperties: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
