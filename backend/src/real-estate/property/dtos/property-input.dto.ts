import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class PropertyInputDto {
  id?: number = 0;
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  size: number;
}
