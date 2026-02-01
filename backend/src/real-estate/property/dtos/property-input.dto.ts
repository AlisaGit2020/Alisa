import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { IsNotEmpty, IsNumber, Max, Min, IsOptional, IsString } from 'class-validator';

export class PropertyInputDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  size: number;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  ownerships?: OwnershipInputDto[] = [];
}
