// auth/facebook-auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class FacebookAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req, @Res() res) {
    const accessToken = await this.authService.login(req.user);

    res.setHeader('Cache-Control', 'no-store');
    res.status(303);

    res.redirect(
      `${process.env.ALLOWED_ORIGIN}/login?access_token=${accessToken}`,
    );
  }
}
