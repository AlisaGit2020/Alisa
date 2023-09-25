//This class calculates an apartment key figures by given parameters
export namespace Lib {
    export namespace RealEstate {
        export class InvestmentCalculator {
            //All properties are public and readonly
            public readonly deptFreePrice: number = 0;
            public readonly deptShare: number = 0;
            public readonly transferTaxPercent: number;
            public readonly maintenanceFee: number;
            public readonly chargeForFinancialCosts: number;
            public readonly rentPerMonth: number;
            public readonly apartmentSize: number;
            public readonly waterCharge: number;

            constructor(investment: InvestmentInput) {
                this.deptFreePrice = investment.deptFreePrice;
                this.deptShare = investment.deptShare;
                this.transferTaxPercent = investment.transferTaxPercent;
                this.maintenanceFee = investment.maintenanceFee;
                this.chargeForFinancialCosts = investment.chargeForFinancialCosts;
                this.rentPerMonth = investment.rentPerMonth;
                this.apartmentSize = investment.apartmentSize || 0;
                this.waterCharge = investment.waterCharge || 0;
            }

            public get sellingPrice(): number {
                return this.roundToTwo(this.deptFreePrice - this.deptShare)
            }

            public get transferTax(): number {
                return this.roundToTwo(this.deptFreePrice * this.transferTaxPercent / 100);
            }

            public get maintenanceCosts(): number {
                return this.roundToTwo(this.maintenanceFee + this.chargeForFinancialCosts);
            }

            public get rentalYieldPercent(): number {
                const rentalYield =
                    (this.rentPerMonth - this.maintenanceFee) * 12 /
                    (this.deptFreePrice + this.transferTax) * 100;
                return this.roundToTwo(rentalYield);
            }

            public get rentalIncomePerYear(): number {
                return this.roundToTwo(this.rentPerMonth * 12);
            }

            public get pricePerSquareMeter(): number {
                return this.roundToTwo(this.deptFreePrice / this.apartmentSize);
            }

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
        }
    }
}

