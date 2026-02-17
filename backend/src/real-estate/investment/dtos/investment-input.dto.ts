import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class InvestmentInputDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  deptFreePrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  deptShare: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  transferTaxPercent: number = 2; //default 2%

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  maintenanceFee: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  chargeForFinancialCosts: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rentPerMonth: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  apartmentSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waterCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  loanInterestPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  loanPeriod?: number; //in years

  @IsOptional()
  @IsNumber()
  @Min(1)
  propertyId?: number;

  @IsOptional()
  @IsString()
  name?: string;
}
