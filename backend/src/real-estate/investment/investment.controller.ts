import { Body, Controller, Get, Post } from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentCalculatorInputDto } from './dtos/investment-calculator-input.dto';
import { InvestmentService } from './investment.service';
import { Investment } from './entities/investment.entity';

@Controller('real-estate/investment')
export class InvestmentController {
  constructor(private investmentService: InvestmentService) {}

  @Get('/')
  async findAll(): Promise<Investment[]> {
    return this.investmentService.findAll();
  }

  @Get('/:id')
  async findOne(id: number): Promise<Investment> {
    return this.investmentService.findOne(id);
  }

  @Post('/calculate')
  async calculateInvestment(
    @Body() investment: InvestmentCalculatorInputDto,
  ): Promise<InvestmentCalculator> {
    return this.investmentService.calculateInvestment(investment);
  }

  @Post('/calculate/save')
  async saveCalculateInvestment(
    @Body() investment: InvestmentCalculatorInputDto,
  ): Promise<Investment> {
    const calculatedInvestment =
      this.investmentService.calculateInvestment(investment);
    return this.investmentService.saveCalculatedInvestment(
      calculatedInvestment,
    );
  }
}
