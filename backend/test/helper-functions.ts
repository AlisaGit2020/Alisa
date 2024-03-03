import { AuthService } from '@alisa-backend/auth/auth.service';
import { JWTUser } from '@alisa-backend/auth/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';

export const getUserAccessToken = async (
  authService: AuthService,
): Promise<string> => {
  return authService.login({
    firstName: 'Test',
    lastName: 'Tester',
    email: 'test@email.com',
  });
};

export const getUserAccessToken2 = async (
  authService: AuthService,
  user: JWTUser,
): Promise<string> => {
  return authService.login(user);
};

export const getBearerToken = (token: string): string => {
  return `Bearer ${token}`;
};

export const addProperty = async (
  propertyService: PropertyService,
  name: string,
  size: number,
  user: JWTUser,
) => {
  const inputProperty = new PropertyInputDto();
  inputProperty.name = name;
  inputProperty.size = size;

  const ownership = new OwnershipInputDto();
  ownership.share = 100;
  inputProperty.ownerships.push(ownership);

  await propertyService.add(user, inputProperty);
};
