//This class calculates an apartment key figures by given parameters
export namespace Lib {
    export namespace RealEstate {
        export class InvestmentCalculator {
            public purchasePrice: number = 0;
            public deptShare: number = 0;

            constructor(investment: InvestmentInput) {
                this.purchasePrice = investment.purchasePrice;
                this.deptShare = investment.deptShare;
            }
        }

        //Investment input type
        export type InvestmentInput = {
            purchasePrice: number;
            deptShare: number;
        }
    }
}

