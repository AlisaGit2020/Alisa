//Tests for InvestmentCalculator.ts

import {Lib} from "./InvestmentCalculator";

describe("InvestmentCalculator", () => {
    it("should calculate the correct key figures", () => {
        //Arrange
        let calc = new Lib.RealEstate.InvestmentCalculator({
            purchasePrice: 100000,
            deptShare: 2999.79
        });

        expect(calc.purchasePrice).toBe(100000);
        expect(calc.deptShare).toBe(2999.79);

    });
});
