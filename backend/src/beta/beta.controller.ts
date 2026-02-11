import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BetaService } from './beta.service';
import { BetaSignupInputDto } from './dtos/beta-signup-input.dto';

@Controller('beta')
export class BetaController {
  constructor(private readonly betaService: BetaService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() input: BetaSignupInputDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.betaService.signup(input);
  }
}
