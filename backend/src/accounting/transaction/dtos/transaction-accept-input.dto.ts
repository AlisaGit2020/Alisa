import { IsArray, ArrayNotEmpty, IsNumber, Min } from 'class-validator';

export class TransactionAcceptInputDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  ids: number[];
}
