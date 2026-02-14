import { IsOptional, IsString } from 'class-validator';

export class AddressInputDto {
  id?: number;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}
