import { ArrayNotEmpty, IsArray, IsNumber, Min } from 'class-validator';

export class BulkDeleteInputDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  ids: number[];
}
