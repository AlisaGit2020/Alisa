import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxService } from './tax.service';
import { TaxCalculateInputDto } from './dtos/tax-calculate-input.dto';
import { TaxResponseDto } from './dtos/tax-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('real-estate/property/tax')
export class TaxController {
  constructor(private taxService: TaxService) {}

  @Post('/calculate')
  @HttpCode(200)
  async calculate(
    @User() user: JWTUser,
    @Body() input: TaxCalculateInputDto,
  ): Promise<TaxResponseDto> {
    return this.taxService.calculate(user, input);
  }

  @Get('/')
  async get(
    @User() user: JWTUser,
    @Query('propertyId') propertyId?: string,
    @Query('year') year?: string,
  ): Promise<TaxResponseDto | null> {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear() - 1;
    const propId = propertyId ? parseInt(propertyId, 10) : undefined;
    return this.taxService.get(user, propId, yearNum);
  }
}
