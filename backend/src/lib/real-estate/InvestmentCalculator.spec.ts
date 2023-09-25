//Tests for InvestmentCalculator.ts

import {Lib} from "./InvestmentCalculator";

describe("InvestmentCalculator", () => {
    it("should calculate the correct key figures", () => {
        //Arrange
        let calc = new Lib.RealEstate.InvestmentCalculator({
            deptFreePrice: 100000,
            deptShare: 2999.79,
            transferTaxPercent: 2,
            maintenanceFee: 66,
            chargeForFinancialCosts: 19.63,
            rentPerMonth: 500,
            apartmentSize: 30,
            waterCharge: 16
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

        //Calculation checks
        expect(calc.sellingPrice).toBe(97000.21);
        expect(calc.transferTax).toBe(2000);
        expect(calc.maintenanceCosts).toBe(85.63);
        expect(calc.rentalYieldPercent).toBe(5.11);
        expect(calc.rentalIncomePerYear).toBe(6000);
        expect(calc.pricePerSquareMeter).toBe(3333.33);

    });
});
