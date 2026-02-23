import { UserInputDto } from '@asset-backend/people/user/dtos/user-input.dto';
import { PropertyInputDto } from '@asset-backend/real-estate/property/dtos/property-input.dto';
import { IsNumber, Max, Min } from 'class-validator';

export class OwnershipInputDto {
  user?: UserInputDto;

  @IsNumber()
  userId: number;

  property?: PropertyInputDto;

  @IsNumber()
  propertyId?: number;

  @Min(1)
  @Max(100)
  share: number;
}
