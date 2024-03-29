// auth/auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { User } from '../people/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const accessToken = await this.authService.login(req.user);

    res.setHeader('Cache-Control', 'no-store');
    res.status(303);

    res.redirect(
      `${process.env.ALLOWED_ORIGIN}/login?access_token=${accessToken}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  async findAll(@Req() req): Promise<User> {
    const user = req.user;
    return this.authService.getUserInfo(user.email);
  }

  @Get('logout')
  logout(@Req() req, @Res() res) {
    res.redirect('/');
  }
}
