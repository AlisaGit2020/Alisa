export type JWTUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  language: string;
  ownershipInProperties: number[];
  isAdmin: boolean;
  tierId?: number;
  tierName?: string;
  tierMaxProperties?: number;
};
