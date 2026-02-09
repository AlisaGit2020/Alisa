import { Controller, Get, UseGuards } from '@nestjs/common';
import { GoogleService } from './google.service';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('gmail/authenticate')
  async authenticate() {
    const requiresAuthentication =
      await this.googleService.requiresAuthentication();
    if (requiresAuthentication) {
      const authUrl = await this.googleService.getAuthenticationUrl();
      return { url: authUrl };
    } else {
      return { url: '/success' };
    }
  }
}
