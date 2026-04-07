import { UserRole } from '@asset-backend/common/types';

export type JWTUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  ownershipInProperties: number[];
  roles: UserRole[];
  tierId?: number;
  tierName?: string;
  tierMaxProperties?: number;
};
