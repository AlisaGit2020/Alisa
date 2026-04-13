import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { createJWTUser } from 'test/factories';
import { JWTUser } from '@asset-backend/auth/types';
import { UserRole } from '@asset-backend/common/types';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  const createMockContext = (user: JWTUser | undefined): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('allows request when user has ADMIN role', () => {
    const user = createJWTUser({ roles: [UserRole.ADMIN, UserRole.OWNER] });
    const context = createMockContext(user);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when user does not have ADMIN role', () => {
    const user = createJWTUser({ roles: [UserRole.OWNER] });
    const context = createMockContext(user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is not present', () => {
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
