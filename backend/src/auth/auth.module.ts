// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { AuthController } from './auth.controller';
import { FacebookAuthController } from './facebook-auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants, facebookConstants } from './constants';
import { PeopleModule } from '../people/people.module';
import { TierModule } from '@asset-backend/admin/tier.module';

// Only include Facebook OAuth if credentials are configured
const facebookEnabled = !!facebookConstants.clientID;
const conditionalProviders = facebookEnabled ? [FacebookStrategy] : [];
const conditionalControllers = facebookEnabled ? [FacebookAuthController] : [];

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    PeopleModule,
    TierModule,
  ],
  controllers: [AuthController, ...conditionalControllers],
  providers: [AuthService, GoogleStrategy, JwtStrategy, ...conditionalProviders],
  exports: [AuthService],
})
export class AuthModule {}
