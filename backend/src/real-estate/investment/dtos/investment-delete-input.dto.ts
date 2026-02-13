import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray } from 'class-validator';

export class InvestmentDeleteInputDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(100)
  ids: number[];
}
