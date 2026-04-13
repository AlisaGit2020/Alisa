import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@asset-backend/common/types';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (
    user: { id: number; roles: UserRole[] },
    requiredRoles?: UserRole[],
  ): ExecutionContext => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(requiredRoles ?? null);

    return mockContext;
  };

  it('should allow access when no roles are required', () => {
    const user = { id: 1, roles: [UserRole.OWNER] };
    const context = createMockExecutionContext(user, undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const user = { id: 1, roles: [UserRole.ADMIN] };
    const context = createMockExecutionContext(user, [UserRole.ADMIN]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    const user = { id: 1, roles: [UserRole.OWNER] };
    const context = createMockExecutionContext(user, [UserRole.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient role');
  });

  it('should throw ForbiddenException when user has no roles', () => {
    const user = { id: 1, roles: [] };
    const context = createMockExecutionContext(user, [UserRole.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient role');
  });

  it('should allow when user has any one of multiple required roles', () => {
    const user = { id: 1, roles: [UserRole.OWNER] };
    const context = createMockExecutionContext(user, [
      UserRole.ADMIN,
      UserRole.OWNER,
    ]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow when user has multiple roles and one matches', () => {
    const user = { id: 1, roles: [UserRole.OWNER, UserRole.CLEANER] };
    const context = createMockExecutionContext(user, [UserRole.CLEANER]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should work with reflector getAllAndOverride', () => {
    const user = { id: 1, roles: [UserRole.ADMIN] };
    const context = createMockExecutionContext(user, [UserRole.ADMIN]);

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
