//This class calculates an apartment key figures by given parameters
import {pmt} from "financial";

export namespace Lib {
    export namespace RealEstate {
        export class InvestmentCalculator {
            //All properties are public and readonly

            /**
             * Dept free price when buying
             */
            public readonly deptFreePrice: number = 0;

            /**
             * Dept share when buying
             */
            public readonly deptShare: number = 0;

            /**
             * Transfer tax in percent when buying
             */
            public readonly transferTaxPercent: number;

            /**
             * Maintenance fee per month
             */
            public readonly maintenanceFee: number;

            /**
             * Charge for financial costs per month
             */
            public readonly chargeForFinancialCosts: number;

            /**
             * Rent per month
             */
            public readonly rentPerMonth: number;

            /**
             * Apartment size in square meters
             */
            public readonly apartmentSize: number;

            /**
             * Water charge per month
             */
            public readonly waterCharge: number;

            /**
             * Own contribution
             */
            public readonly downPayment: number;

            /**
             * Loan interest in percent
             */
            public readonly loanInterestPercent: number;

            /**
             * Loan period in years
             */
            public readonly loanPeriod: number;

            constructor(investment: InvestmentInput) {
                this.deptFreePrice = investment.deptFreePrice;
                this.deptShare = investment.deptShare;
                this.transferTaxPercent = investment.transferTaxPercent;
                this.maintenanceFee = investment.maintenanceFee;
                this.chargeForFinancialCosts = investment.chargeForFinancialCosts;
                this.rentPerMonth = investment.rentPerMonth;
                this.apartmentSize = investment.apartmentSize || 0;
                this.waterCharge = investment.waterCharge || 0;
                this.downPayment = investment.downPayment || 0;
                this.loanInterestPercent = investment.loanInterestPercent || 0;
                this.loanPeriod = investment.loanPeriod || 0;
            }

            /**
             * Selling price after dept share
             */
            public get sellingPrice(): number {
                return this.roundToTwo(this.deptFreePrice - this.deptShare)
            }

            /**
             * Transfer tax to pay when buying
             */
            public get transferTax(): number {
                return this.roundToTwo(this.deptFreePrice * this.transferTaxPercent / 100);
            }

            /**
             * Maintenance total costs per month
             */
            public get maintenanceCosts(): number {
                return this.roundToTwo(this.maintenanceFee + this.chargeForFinancialCosts);
            }

            /**
             * Rental yield in percent
             */
            public get rentalYieldPercent(): number {
                const rentalYield =
                    (this.rentPerMonth - this.maintenanceFee) * 12 /
                    (this.deptFreePrice + this.transferTax) * 100;
                return this.roundToTwo(rentalYield);
            }

            /**
             * Rental income per year
             */
            public get rentalIncomePerYear(): number {
                return this.roundToTwo(this.rentPerMonth * 12);
            }

            /**
             * Price per square meter
             */
            public get pricePerSquareMeter(): number {
                return this.roundToTwo(this.deptFreePrice / this.apartmentSize);
            }

            /**
             * Bank loan financing. Includes transfer tax.
             */
            public get loanFinancing(): number {
                return this.roundToTwo(this.sellingPrice + this.transferTax - this.downPayment);
            }

            /**
             * Bank loan first month interest
             */
            public get loanFirstMonthInterest(): number {
                const interest = this.loanInterestPercent / 12 / 100 * this.loanFinancing;
                return this.roundToTwo(interest);
            }

            /**
             * Bank loan first month installment
             */
            public get loanFirstMonthInstallment(): number {
                const installment = pmt(
                    (this.loanInterestPercent / 100) / 12,
                    12 * this.loanPeriod,
                    this.loanFinancing)
                return this.roundToTwo(installment * -1);
            }

            /**
             * tax deductible expenses per year
             */
            public get taxDeductibleExpensesPerYear(): number {
                return this.roundToTwo((this.maintenanceCosts * 12) + (this.loanFirstMonthInterest * 12));
            }

            /**
             * Profit per year
             */
            public get profitPerYear(): number {
                return this.roundToTwo(this.rentalIncomePerYear - this.taxDeductibleExpensesPerYear);
            }

            /**
             * Tax per year
             */
            public get taxPerYear(): number {
                let taxPercent = 0.3;
                if (this.profitPerYear > 30000) {
                    taxPercent = 0.34;
                }
                return this.roundToTwo(this.profitPerYear * taxPercent);
            }

            /**
             * Expenses per month
             */
            public get expensesPerMonth(): number {
                return this.roundToTwo(this.maintenanceCosts + this.loanFirstMonthInstallment);
            }

            /**
             * Cash flow per month
             */
            public get cashFlowPerMonth(): number {
                return this.roundToTwo(this.rentPerMonth - this.expensesPerMonth);
            }

            /**
             * Cash flow after tax per month
             */
            public get cashFlowAfterTaxPerMonth(): number {
                return this.roundToTwo(this.cashFlowPerMonth - (this.taxPerYear / 12));
            }

            /**
             * Round to two decimals
             * @param num
             * @private
             */
            private roundToTwo(num: number): number {
                return Math.round(num * 100) / 100;
            }
        }

        //Investment input type
        export type InvestmentInput = {
            deptFreePrice: number;
            deptShare: number;
            transferTaxPercent: number;
            maintenanceFee: number;
            chargeForFinancialCosts: number;
            rentPerMonth: number;
            apartmentSize?: number;
            waterCharge?: number;
            downPayment?: number;
            loanInterestPercent?: number;
            loanPeriod?: number; //in years
        }
    }
}

