import { OwnershipInputDto } from '@asset-backend/people/ownership/dtos/ownership-input.dto';
import { AddressInputDto } from '@asset-backend/real-estate/address/dtos/address-input.dto';
import {
  PropertyExternalSource,
  PropertyStatus,
} from '@asset-backend/common/types';
import {
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
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

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsEnum(PropertyExternalSource)
  externalSource?: PropertyExternalSource;

  @IsOptional()
  @IsString()
  externalSourceId?: string;

  @IsOptional()
  @IsString()
  rooms?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  purchaseDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseLoan?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  saleDate?: Date;

  ownerships?: OwnershipInputDto[];
}
