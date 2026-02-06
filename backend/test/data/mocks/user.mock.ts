import { JWTUser } from '@alisa-backend/auth/types';

export const getJWTUser = (
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  ownershipInProperties: number[],
  isAdmin: boolean = false,
): JWTUser => {
  return {
    id: id,
    firstName: firstName,
    lastName: lastName,
    email: email,
    language: 'fi',
    ownershipInProperties: ownershipInProperties,
    isAdmin: isAdmin,
  };
};

export const jwtUser1 = getJWTUser(1, 'John', 'Doe', 'john@doe.com', []);
export const jwtUser2 = getJWTUser(2, 'Jane', 'Fonda', 'jane@fonda.io', [1, 2]);
export const jwtUser3 = getJWTUser(3, 'Joe', 'Biden', 'joe@biden.com', [3, 4]);
