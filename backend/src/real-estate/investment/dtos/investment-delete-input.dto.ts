import { IsArray, IsNotEmpty } from 'class-validator';

export class InvestmentDeleteInputDto {
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
