import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { IsNotEmpty, IsNumber, Max, Min, IsOptional, IsString, IsInt } from 'class-validator';

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

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  buildYear?: number;

  @IsOptional()
  @IsString()
  apartmentType?: string;

  ownerships?: OwnershipInputDto[] = [];
}
