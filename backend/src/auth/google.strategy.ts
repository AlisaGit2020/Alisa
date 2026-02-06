// auth/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { googleConstants } from './constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: googleConstants.clientID,
      clientSecret: googleConstants.clientSecret,
      callbackURL: googleConstants.callbackURL,
      passReqToCallback: true,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const language =
      profile._json.locale ||
      this.parseAcceptLanguage(request.headers?.['accept-language']);

    const user: UserInputDto = {
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      email: profile.emails[0].value,
      language,
      photo: profile._json.picture,
    };

    return done(null, user);
  }

  private parseAcceptLanguage(header: string): string | undefined {
    if (!header) {
      return undefined;
    }
    const first = header.split(',')[0];
    return first?.split(';')[0]?.trim() || undefined;
  }
}
