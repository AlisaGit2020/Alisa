import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { createJWTUser } from 'test/factories';
import { JWTUser } from '@alisa-backend/auth/types';

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

  it('allows request when user.isAdmin is true', () => {
    const user = createJWTUser({ isAdmin: true });
    const context = createMockContext(user);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when user.isAdmin is false', () => {
    const user = createJWTUser({ isAdmin: false });
    const context = createMockContext(user);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is not present', () => {
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
