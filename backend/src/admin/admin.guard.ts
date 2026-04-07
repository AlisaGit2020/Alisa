import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JWTUser } from '@asset-backend/auth/types';
import { UserRole } from '@asset-backend/common/types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JWTUser;
    if (!user?.roles?.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
