// auth/auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const payload = await this.authService.login(req.user);
    res.json(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/test')
  async findAll(): Promise<number[]> {
    return [1, 2, 3, 4];
  }

  @Get('logout')
  logout(@Req() req, @Res() res) {
    res.redirect('/');
  }
}
