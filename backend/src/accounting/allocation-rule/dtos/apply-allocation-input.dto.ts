import { IsArray, IsNumber } from 'class-validator';

export class ApplyAllocationInputDto {
  @IsNumber()
  propertyId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  transactionIds: number[];
}
