import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvestmentService } from './investment.service';
import { Investment } from './entities/investment.entity';
import { InvestmentCalculator } from './classes/investment-calculator.class';
import { InvestmentInputDto } from './dtos/investment-input.dto';
import { createMockRepository, MockRepository } from 'test/mocks';

describe('InvestmentService', () => {
  let service: InvestmentService;
  let mockRepository: MockRepository<Investment>;

  const createInvestment = (options: Partial<Investment> = {}): Investment => {
    const investment = new Investment();
    investment.id = options.id ?? 1;
    investment.deptFreePrice = options.deptFreePrice ?? 100000;
    investment.deptShare = options.deptShare ?? 0;
    investment.transferTaxPercent = options.transferTaxPercent ?? 2;
    investment.maintenanceFee = options.maintenanceFee ?? 200;
    investment.chargeForFinancialCosts = options.chargeForFinancialCosts ?? 50;
    investment.rentPerMonth = options.rentPerMonth ?? 800;
    investment.apartmentSize = options.apartmentSize ?? 50;
    investment.waterCharge = options.waterCharge ?? 20;
    investment.downPayment = options.downPayment ?? 20000;
    investment.loanInterestPercent = options.loanInterestPercent ?? 3;
    investment.loanPeriod = options.loanPeriod ?? 25;
    investment.sellingPrice = options.sellingPrice ?? 100000;
    investment.transferTax = options.transferTax ?? 2000;
    investment.maintenanceCosts = options.maintenanceCosts ?? 250;
    investment.rentalYieldPercent = options.rentalYieldPercent ?? 7.06;
    investment.rentalIncomePerYear = options.rentalIncomePerYear ?? 9600;
    investment.pricePerSquareMeter = options.pricePerSquareMeter ?? 2000;
    investment.loanFinancing = options.loanFinancing ?? 82000;
    investment.loanFirstMonthInterest = options.loanFirstMonthInterest ?? 205;
    investment.loanFirstMonthInstallment = options.loanFirstMonthInstallment ?? 388.56;
    investment.taxDeductibleExpensesPerYear = options.taxDeductibleExpensesPerYear ?? 5460;
    investment.profitPerYear = options.profitPerYear ?? 4140;
    investment.taxPerYear = options.taxPerYear ?? 1242;
    investment.expensesPerMonth = options.expensesPerMonth ?? 638.56;
    investment.cashFlowPerMonth = options.cashFlowPerMonth ?? 161.44;
    investment.cashFlowAfterTaxPerMonth = options.cashFlowAfterTaxPerMonth ?? 57.94;
    return investment;
  };

  const createTestInput = (): InvestmentInputDto => ({
    deptFreePrice: 100000,
    deptShare: 0,
    transferTaxPercent: 2,
    maintenanceFee: 200,
    chargeForFinancialCosts: 50,
    rentPerMonth: 800,
    apartmentSize: 50,
    waterCharge: 20,
    downPayment: 20000,
    loanInterestPercent: 3,
    loanPeriod: 25,
  });

  beforeEach(async () => {
    mockRepository = createMockRepository<Investment>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        { provide: getRepositoryToken(Investment), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
  });

  describe('calculate', () => {
    it('returns an InvestmentCalculator instance', () => {
      const input = createTestInput();

      const result = service.calculate(input);

      expect(result).toBeInstanceOf(InvestmentCalculator);
    });

    it('calculates selling price correctly', () => {
      const input = createTestInput();
      input.deptFreePrice = 150000;
      input.deptShare = 20000;

      const result = service.calculate(input);

      expect(result.sellingPrice).toBe(130000);
    });

    it('calculates transfer tax correctly', () => {
      const input = createTestInput();
      input.deptFreePrice = 100000;
      input.transferTaxPercent = 2;

      const result = service.calculate(input);

      expect(result.transferTax).toBe(2000);
    });

    it('calculates maintenance costs correctly', () => {
      const input = createTestInput();
      input.maintenanceFee = 200;
      input.chargeForFinancialCosts = 50;

      const result = service.calculate(input);

      expect(result.maintenanceCosts).toBe(250);
    });

    it('calculates rental income per year correctly', () => {
      const input = createTestInput();
      input.rentPerMonth = 800;

      const result = service.calculate(input);

      expect(result.rentalIncomePerYear).toBe(9600);
    });

    it('calculates price per square meter correctly', () => {
      const input = createTestInput();
      input.deptFreePrice = 100000;
      input.apartmentSize = 50;

      const result = service.calculate(input);

      expect(result.pricePerSquareMeter).toBe(2000);
    });

    it('calculates loan financing correctly', () => {
      const input = createTestInput();
      input.deptFreePrice = 100000;
      input.deptShare = 0;
      input.transferTaxPercent = 2;
      input.downPayment = 20000;

      const result = service.calculate(input);

      expect(result.loanFinancing).toBe(82000);
    });

    it('uses default values for optional fields', () => {
      const input: InvestmentInputDto = {
        deptFreePrice: 100000,
        deptShare: 0,
        transferTaxPercent: 2,
        maintenanceFee: 200,
        chargeForFinancialCosts: 50,
        rentPerMonth: 800,
      };

      const result = service.calculate(input);

      expect(result.apartmentSize).toBe(0);
      expect(result.waterCharge).toBe(0);
      expect(result.downPayment).toBe(0);
      expect(result.loanInterestPercent).toBe(0);
      expect(result.loanPeriod).toBe(0);
    });

    it('calculates tax correctly for profit under 30000', () => {
      const input = createTestInput();

      const result = service.calculate(input);

      expect(result.profitPerYear).toBeLessThan(30000);
      expect(result.taxPerYear).toBe(Math.round(result.profitPerYear * 0.3 * 100) / 100);
    });
  });

  describe('findAll', () => {
    it('returns all investments', async () => {
      const investments = [
        createInvestment({ id: 1 }),
        createInvestment({ id: 2 }),
      ];
      mockRepository.find.mockResolvedValue(investments);

      const result = await service.findAll();

      expect(result).toEqual(investments);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('returns empty array when no investments exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('returns investments matching search options', async () => {
      const investments = [createInvestment({ id: 1, rentPerMonth: 1000 })];
      mockRepository.find.mockResolvedValue(investments);

      const result = await service.search({ where: { rentPerMonth: 1000 } });

      expect(result).toEqual(investments);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { rentPerMonth: 1000 },
      });
    });

    it('returns empty array when no investments match', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.search({ where: { rentPerMonth: 99999 } });

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns investment when found', async () => {
      const investment = createInvestment({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(investment);

      const result = await service.findOne(1);

      expect(result).toEqual(investment);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns null when investment not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('saveCalculation', () => {
    it('creates new investment when id is not provided', async () => {
      const input = createTestInput();
      const calculator = new InvestmentCalculator(input);
      const savedInvestment = createInvestment({ id: 1 });
      mockRepository.save.mockResolvedValue(savedInvestment);

      const result = await service.saveCalculation(calculator);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('updates existing investment when id is provided', async () => {
      const input = createTestInput();
      const calculator = new InvestmentCalculator(input);
      const existingInvestment = createInvestment({ id: 1 });
      mockRepository.findOneBy.mockResolvedValue(existingInvestment);
      mockRepository.save.mockResolvedValue(existingInvestment);

      const result = await service.saveCalculation(calculator, 1);

      expect(result.id).toBe(1);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('throws error when investment not found for update', async () => {
      const input = createTestInput();
      const calculator = new InvestmentCalculator(input);
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.saveCalculation(calculator, 999)).rejects.toThrow(
        'Investment not found',
      );
    });

    it('saves all calculated fields correctly', async () => {
      const input = createTestInput();
      const calculator = new InvestmentCalculator(input);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.saveCalculation(calculator);

      expect(result.deptFreePrice).toBe(calculator.deptFreePrice);
      expect(result.deptShare).toBe(calculator.deptShare);
      expect(result.transferTaxPercent).toBe(calculator.transferTaxPercent);
      expect(result.maintenanceFee).toBe(calculator.maintenanceFee);
      expect(result.sellingPrice).toBe(calculator.sellingPrice);
      expect(result.transferTax).toBe(calculator.transferTax);
      expect(result.rentalYieldPercent).toBe(calculator.rentalYieldPercent);
      expect(result.profitPerYear).toBe(calculator.profitPerYear);
      expect(result.cashFlowPerMonth).toBe(calculator.cashFlowPerMonth);
    });
  });

  describe('delete', () => {
    it('deletes investment by id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('completes without error when investment does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete(999)).resolves.toBeUndefined();
    });
  });

  describe('InvestmentCalculator calculations', () => {
    it('calculates rental yield percent correctly', () => {
      const input: InvestmentInputDto = {
        deptFreePrice: 100000,
        deptShare: 0,
        transferTaxPercent: 2,
        maintenanceFee: 200,
        chargeForFinancialCosts: 0,
        rentPerMonth: 800,
      };

      const result = service.calculate(input);

      // Rental yield = ((rent - maintenance) * 12 / (price + tax)) * 100
      // = ((800 - 200) * 12 / (100000 + 2000)) * 100
      // = (7200 / 102000) * 100
      // = 7.06%
      expect(result.rentalYieldPercent).toBe(7.06);
    });

    it('calculates loan first month interest correctly', () => {
      const input: InvestmentInputDto = {
        deptFreePrice: 100000,
        deptShare: 0,
        transferTaxPercent: 2,
        maintenanceFee: 200,
        chargeForFinancialCosts: 0,
        rentPerMonth: 800,
        downPayment: 0,
        loanInterestPercent: 3,
        loanPeriod: 25,
      };

      const result = service.calculate(input);

      // loanFinancing = 100000 + 2000 - 0 = 102000
      // firstMonthInterest = (3 / 12 / 100) * 102000 = 255
      expect(result.loanFinancing).toBe(102000);
      expect(result.loanFirstMonthInterest).toBe(255);
    });

    it('calculates cash flow correctly', () => {
      const input: InvestmentInputDto = {
        deptFreePrice: 100000,
        deptShare: 0,
        transferTaxPercent: 2,
        maintenanceFee: 200,
        chargeForFinancialCosts: 50,
        rentPerMonth: 800,
        downPayment: 20000,
        loanInterestPercent: 3,
        loanPeriod: 25,
      };

      const result = service.calculate(input);

      // cashFlowPerMonth = rentPerMonth - expensesPerMonth
      expect(result.cashFlowPerMonth).toBe(
        Math.round((result.rentPerMonth - result.expensesPerMonth) * 100) / 100,
      );
    });
  });
});
