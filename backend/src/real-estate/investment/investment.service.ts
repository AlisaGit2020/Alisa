import { Injectable } from '@nestjs/common';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentCalculatorInputDto } from './dtos/investment-calculator-input.dto';
import { Investment } from './entities/investment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class InvestmentService {
  constructor(
    @InjectRepository(Investment)
    private investmentsRepository: Repository<Investment>,
  ) {}

  calculateInvestment(
    investment: InvestmentCalculatorInputDto,
  ): InvestmentCalculator {
    return new InvestmentCalculator(investment);
  }

  async findAll(): Promise<Investment[]> {
    return this.investmentsRepository.find();
  }

  async findOne(id: number): Promise<Investment> {
    return this.investmentsRepository.findOneBy({ id: id });
  }

  async saveCalculatedInvestment(
    investmentCalculation: InvestmentCalculator,
  ): Promise<Investment> {
    // save to database
    const investmentEntity = new Investment();
    investmentEntity.deptFreePrice = investmentCalculation.deptFreePrice;
    investmentEntity.deptShare = investmentCalculation.deptShare;
    investmentEntity.transferTaxPercent =
      investmentCalculation.transferTaxPercent;
    investmentEntity.maintenanceFee = investmentCalculation.maintenanceFee;
    investmentEntity.chargeForFinancialCosts =
      investmentCalculation.chargeForFinancialCosts;
    investmentEntity.rentPerMonth = investmentCalculation.rentPerMonth;
    investmentEntity.apartmentSize = investmentCalculation.apartmentSize;
    investmentEntity.waterCharge = investmentCalculation.waterCharge;
    investmentEntity.downPayment = investmentCalculation.downPayment;
    investmentEntity.loanInterestPercent =
      investmentCalculation.loanInterestPercent;
    investmentEntity.loanPeriod = investmentCalculation.loanPeriod;
    investmentEntity.sellingPrice = investmentCalculation.sellingPrice;
    investmentEntity.transferTax = investmentCalculation.transferTax;
    investmentEntity.maintenanceCosts = investmentCalculation.maintenanceCosts;
    investmentEntity.rentalYieldPercent =
      investmentCalculation.rentalYieldPercent;
    investmentEntity.rentalIncomePerYear =
      investmentCalculation.rentalIncomePerYear;
    investmentEntity.pricePerSquareMeter =
      investmentCalculation.pricePerSquareMeter;
    investmentEntity.loanFinancing = investmentCalculation.loanFinancing;
    investmentEntity.loanFirstMonthInterest =
      investmentCalculation.loanFirstMonthInterest;
    investmentEntity.loanFirstMonthInstallment =
      investmentCalculation.loanFirstMonthInstallment;
    investmentEntity.taxDeductibleExpensesPerYear =
      investmentCalculation.taxDeductibleExpensesPerYear;
    investmentEntity.profitPerYear = investmentCalculation.profitPerYear;
    investmentEntity.taxPerYear = investmentCalculation.taxPerYear;
    investmentEntity.expensesPerMonth = investmentCalculation.expensesPerMonth;
    investmentEntity.cashFlowPerMonth = investmentCalculation.cashFlowPerMonth;
    investmentEntity.cashFlowAfterTaxPerMonth =
      investmentCalculation.cashFlowAfterTaxPerMonth;

    await this.investmentsRepository.save(investmentEntity);
    return investmentEntity;
  }
}
