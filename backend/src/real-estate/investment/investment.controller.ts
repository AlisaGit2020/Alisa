import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentInputDto } from './dtos/investment-input.dto';
import { InvestmentService } from './investment.service';
import { Investment } from './entities/investment.entity';
import { FindManyOptions } from 'typeorm';

@Controller('real-estate/investment')
export class InvestmentController {
  constructor(private service: InvestmentService) {}

  @Post('/search')
  @HttpCode(200)
  async search(
    @Body() options: FindManyOptions<Investment>,
  ): Promise<Investment[]> {
    return this.service.search(options);
  }

  @Get('/')
  async findAll(): Promise<Investment[]> {
    return this.service.findAll();
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<Investment> {
    return this.service.findOne(Number(id));
  }

  @Post('/calculate')
  async calculateInvestment(
    @Body() investment: InvestmentInputDto,
  ): Promise<InvestmentCalculator> {
    return this.service.calculate(investment);
  }

  @Post('/')
  async saveInvestmentCalculation(
    @Body() investment: InvestmentInputDto,
    id?: number,
  ): Promise<Investment> {
    const calculatedInvestment = this.service.calculate(investment);
    return this.service.saveCalculation(calculatedInvestment, id);
  }

  @Put('/:id')
  async updateInvestment(
    @Param('id') id: string,
    @Body() investment: InvestmentInputDto,
  ): Promise<Investment> {
    return this.saveInvestmentCalculation(investment, Number(id));
  }

  @Delete('/:id')
  async deleteInvestment(@Param('id') id: number): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
