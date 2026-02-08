# Auth Module

This module handles authentication and authorization using JWT tokens and Google OAuth.

## Structure

```
auth/
├── auth.controller.ts      # Auth endpoints (login, callback)
├── auth.service.ts         # Core auth logic and ownership checks
├── auth.module.ts          # Module registration
├── jwt.strategy.ts         # JWT Passport strategy
├── jwt.auth.guard.ts       # Route protection guard
├── google.strategy.ts      # Google OAuth Passport strategy
├── types.ts                # JWTUser type definition
├── constants.ts            # JWT constants
└── dtos/                   # User settings DTOs
```

## Authentication Flow

### Google OAuth Flow
```
1. User clicks "Login with Google"
2. Redirect to Google OAuth
3. Google callback → auth/google/callback
4. AuthService.login() creates/updates user and returns JWT
5. JWT stored in frontend, used for subsequent requests
```

### JWT Structure
```typescript
interface JWTUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  ownershipInProperties: number[];  // Property IDs user owns
}
```

## Key Components

### JwtAuthGuard
Protects routes requiring authentication:
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtected(@User() user: JWTUser) {
  // user is authenticated
}
```

### @User() Decorator
Extracts the JWT user from the request:
```typescript
@Get('profile')
getProfile(@User() user: JWTUser) {
  return user;
}
```

### AuthService Methods

| Method | Description |
|--------|-------------|
| `login(user)` | Creates JWT token for user |
| `hasOwnership(user, propertyId)` | Checks if user owns property |
| `addOwnershipFilter(user, where)` | Adds property filter to queries |
| `refreshUserOwnership(user)` | Refreshes ownership cache in JWT |

## Authorization Pattern

All data access is filtered by user ownership:

```typescript
// In service
async findOne(user: JWTUser, id: number) {
  const entity = await this.repository.findOne({ where: { id } });

  if (!entity) return null;

  // Check ownership before returning
  if (!(await this.authService.hasOwnership(user, entity.propertyId))) {
    throw new UnauthorizedException();
  }

  return entity;
}

async search(user: JWTUser, options: FindOptions) {
  // Automatically filter to user's properties
  const where = this.authService.addOwnershipFilter(user, options.where);
  return this.repository.find({ ...options, where });
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/login` | Exchange OAuth code for JWT |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me/settings` | Update user settings |

## Environment Variables

Required in `.env`:
```
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Testing

Mock the AuthService in unit tests:
```typescript
import { createMockAuthService } from 'test/mocks';

const mockAuthService = createMockAuthService();
mockAuthService.hasOwnership.mockResolvedValue(true);
```

## Related Modules

- **people**: User entity and ownership management
- All other modules use AuthService for access control
