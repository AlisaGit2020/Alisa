import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class PropertyInputDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  size: number;

  ownerships?: OwnershipInputDto[] = [];
}
