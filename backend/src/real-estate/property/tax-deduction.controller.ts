import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@asset-backend/auth/jwt.auth.guard';
import { User } from '@asset-backend/common/decorators/user.decorator';
import { JWTUser } from '@asset-backend/auth/types';
import { TaxDeductionService } from './tax-deduction.service';
import { TaxDeductionInputDto } from './dtos/tax-deduction-input.dto';
import { TaxDeductionDto, TaxDeductionCalculationDto } from './dtos/tax-deduction-response.dto';
import { getTravelCompensationRate, DEFAULT_LAUNDRY_PRICE } from './travel-compensation-rates';

@Controller('real-estate/property/tax/deductions')
@UseGuards(JwtAuthGuard)
export class TaxDeductionController {
  constructor(private readonly service: TaxDeductionService) {}

  @Get()
  async findAll(
    @User() user: JWTUser,
    @Query('year', ParseIntPipe) year: number,
    @Query('propertyId') propertyId?: string,
  ): Promise<TaxDeductionDto[]> {
    const propId = propertyId ? parseInt(propertyId, 10) : undefined;
    return this.service.findAllForYear(user, year, propId);
  }

  @Get('calculate')
  async getCalculation(
    @User() user: JWTUser,
    @Query('propertyId', ParseIntPipe) propertyId: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<TaxDeductionCalculationDto> {
    return this.service.getCalculationPreview(user, propertyId, year);
  }

  @Get('rates')
  getRates(@Query('year') yearStr?: string): { year: number; ratePerKm: number; defaultLaundryPrice: number } {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return {
      year,
      ratePerKm: getTravelCompensationRate(year),
      defaultLaundryPrice: DEFAULT_LAUNDRY_PRICE,
    };
  }

  @Post()
  async create(
    @User() user: JWTUser,
    @Body() input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    return this.service.create(user, input);
  }

  @Put(':id')
  async update(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() input: TaxDeductionInputDto,
  ): Promise<TaxDeductionDto> {
    return this.service.update(user, id, input);
  }

  @Delete(':id')
  async delete(
    @User() user: JWTUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.delete(user, id);
  }
}
