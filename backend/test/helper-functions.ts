import { AuthService } from '@alisa-backend/auth/auth.service';

export const getUserAccessToken = async (
  authService: AuthService,
): Promise<string> => {
  const accessToken = await authService.login({
    firstName: 'Test',
    lastName: 'Tester',
    email: 'test@email.com',
  });
  return accessToken;
};
