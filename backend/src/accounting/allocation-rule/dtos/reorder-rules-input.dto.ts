import { IsArray, IsNumber } from 'class-validator';

export class ReorderRulesInputDto {
  @IsNumber()
  propertyId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  ruleIds: number[];
}
