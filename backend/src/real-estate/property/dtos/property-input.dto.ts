import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class PropertyInputDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  size?: number;
}
