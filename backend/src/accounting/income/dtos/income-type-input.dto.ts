import { IsNotEmpty } from 'class-validator';

export class IncomeTypeInputDto {
  id?: number = 0;

  @IsNotEmpty()
  name: string;

  description?: string;
}
