import { IsArray } from 'class-validator';

export class SplitChargePaymentBulkInputDto {
  @IsArray()
  ids: number[];
}
