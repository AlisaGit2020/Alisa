// auth/facebook.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { Request } from 'express';
import { UserInputDto } from '../people/user/dtos/user-input.dto';
import { facebookConstants } from './constants';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: facebookConstants.clientID,
      clientSecret: facebookConstants.clientSecret,
      callbackURL: facebookConstants.callbackURL,
      passReqToCallback: true,
      profileFields: ['id', 'emails', 'name', 'photos'],
      scope: ['email'],
    });
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: UserInputDto) => void,
  ): Promise<void> {
    const language = this.parseAcceptLanguage(
      request.headers?.['accept-language'],
    );

    const user: UserInputDto = {
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      email: profile.emails?.[0]?.value || '',
      language,
      photo: profile.photos?.[0]?.value,
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
