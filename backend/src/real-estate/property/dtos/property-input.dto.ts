import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { AddressInputDto } from '@alisa-backend/real-estate/address/dtos/address-input.dto';
import {
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @ValidateNested()
  @Type(() => AddressInputDto)
  address?: AddressInputDto;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  buildYear?: number;

  @IsOptional()
  @IsString()
  apartmentType?: string;

  ownerships?: OwnershipInputDto[];
}
