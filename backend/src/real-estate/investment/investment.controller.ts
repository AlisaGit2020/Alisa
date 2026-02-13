import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentInputDto } from './dtos/investment-input.dto';
import { InvestmentDeleteInputDto } from './dtos/investment-delete-input.dto';
import { InvestmentService } from './investment.service';
import { Investment } from './entities/investment.entity';
import { FindManyOptions } from 'typeorm';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { JWTUser } from '@alisa-backend/auth/types';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { DataSaveResultDto } from '@alisa-backend/common/dtos/data-save-result.dto';

@Controller('real-estate/investment')
export class InvestmentController {
  constructor(private service: InvestmentService) {}

  // Public endpoint - no authentication required
  @Post('/calculate')
  @HttpCode(200)
  async calculateInvestment(
    @Body() investment: InvestmentInputDto,
  ): Promise<InvestmentCalculator> {
    return this.service.calculate(investment);
  }

  // Protected endpoints below
  @UseGuards(JwtAuthGuard)
  @Post('/search')
  @HttpCode(200)
  async search(
    @User() user: JWTUser,
    @Body() options: FindManyOptions<Investment>,
  ): Promise<Investment[]> {
    return this.service.search(user, options);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async findAll(@User() user: JWTUser): Promise<Investment[]> {
    return this.service.findAll(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOne(
    @User() user: JWTUser,
    @Param('id') id: string,
  ): Promise<Investment> {
    return this.service.findOne(user, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  async saveInvestmentCalculation(
    @User() user: JWTUser,
    @Body() investment: InvestmentInputDto,
    id?: number,
  ): Promise<Investment> {
    const calculatedInvestment = this.service.calculate(investment);
    return this.service.saveCalculation(user, calculatedInvestment, investment, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateInvestment(
    @User() user: JWTUser,
    @Param('id') id: string,
    @Body() investment: InvestmentInputDto,
  ): Promise<Investment> {
    return this.saveInvestmentCalculation(user, investment, Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteInvestment(
    @User() user: JWTUser,
    @Param('id') id: number,
  ): Promise<boolean> {
    await this.service.delete(user, id);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/delete')
  @HttpCode(200)
  async deleteMany(
    @User() user: JWTUser,
    @Body() input: InvestmentDeleteInputDto,
  ): Promise<DataSaveResultDto> {
    return this.service.deleteMany(user, input.ids);
  }
}
