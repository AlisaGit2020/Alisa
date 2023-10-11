import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentInputDto } from './dtos/investment-input.dto';
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
  async findOne(@Param('id') id: string): Promise<Investment> {
    return this.investmentService.findOne(Number(id));
  }

  @Post('/calculate')
  async calculateInvestment(
    @Body() investment: InvestmentInputDto,
  ): Promise<InvestmentCalculator> {

    return this.investmentService.calculate(investment);
  }

  @Post('/')
  async saveInvestmentCalculation(
    @Body() investment: InvestmentInputDto,
    id?: number,
  ): Promise<Investment> {
    const calculatedInvestment =
      this.investmentService.calculate(investment);
    return this.investmentService.saveCalculation(
      calculatedInvestment,
        id
    );
  }

  @Put ('/:id')
  async updateInvestment(@Param('id') id:string, @Body() investment: InvestmentInputDto): Promise<Investment> {
    return this.saveInvestmentCalculation(investment, Number(id))
  }

  @Delete('/:id')
  async deleteInvestment(@Param('id') id:number): Promise<boolean> {
    await this.investmentService.delete (id)
    return true
  }

}
