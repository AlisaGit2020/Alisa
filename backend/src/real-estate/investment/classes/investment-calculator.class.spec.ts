//Tests for investment.class.ts

import { InvestmentCalculator } from './investment-calculator.class';

describe('InvestmentCalculator', () => {
  it('should calculate the correct key figures', () => {
    //Arrange
    const calc = new InvestmentCalculator({
      deptFreePrice: 100000,
      deptShare: 2999.79,
      transferTaxPercent: 2,
      maintenanceFee: 66,
      chargeForFinancialCosts: 19.63,
      rentPerMonth: 500,
      apartmentSize: 30,
      waterCharge: 16,
      downPayment: 10000,
      loanInterestPercent: 5,
      loanPeriod: 20,
    });

    //Input checks
    expect(calc.deptFreePrice).toBe(100000);
    expect(calc.deptShare).toBe(2999.79);
    expect(calc.transferTaxPercent).toBe(2);
    expect(calc.maintenanceFee).toBe(66);
    expect(calc.chargeForFinancialCosts).toBe(19.63);
    expect(calc.rentPerMonth).toBe(500);
    expect(calc.apartmentSize).toBe(30);
    expect(calc.waterCharge).toBe(16);
    expect(calc.downPayment).toBe(10000);
    expect(calc.loanInterestPercent).toBe(5);
    expect(calc.loanPeriod).toBe(20);

    //Calculation checks
    expect(calc.sellingPrice).toBe(97000.21);
    expect(calc.transferTax).toBe(2000);
    expect(calc.maintenanceCosts).toBe(1219.56);
    expect(calc.rentalYieldPercent).toBe(5.11);
    expect(calc.rentalIncomePerYear).toBe(6000);
    expect(calc.pricePerSquareMeter).toBe(3333.33);
    expect(calc.loanFinancing).toBe(89000.21);
    expect(calc.loanFirstMonthInterest).toBe(370.83);
    expect(calc.loanFirstMonthInstallment).toBe(587.36);
    expect(calc.taxDeductibleExpensesPerYear).toBe(5669.52);
    expect(calc.profitPerYear).toBe(330.48);
    expect(calc.taxPerYear).toBe(99.14);
    expect(calc.expensesPerMonth).toBe(688.99);
    expect(calc.cashFlowPerMonth).toBe(-188.99);
    expect(calc.cashFlowAfterTaxPerMonth).toBe(-197.25);
  });
});
