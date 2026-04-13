import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;

export class CleaningInputDto {
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Transform(toNumber)
  propertyId: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(toNumber)
  percentage: number = 100;
}
