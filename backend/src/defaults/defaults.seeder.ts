import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';

interface GlobalExpenseType {
  key: string;
  name: string;
  isTaxDeductible: boolean;
  isCapitalImprovement: boolean;
}

interface GlobalIncomeType {
  key: string;
  name: string;
  isTaxable: boolean;
}

const GLOBAL_EXPENSE_TYPES: GlobalExpenseType[] = [
  {
    key: 'housing-charge',
    name: 'Housing company charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'maintenance-charge',
    name: 'Maintenance charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'financial-charge',
    name: 'Financial charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'repairs',
    name: 'Repairs',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'capital-improvement',
    name: 'Capital improvement',
    isTaxDeductible: false,
    isCapitalImprovement: true,
  },
  {
    key: 'insurance',
    name: 'Insurance',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'property-tax',
    name: 'Property tax',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'water',
    name: 'Water fee',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'electricity',
    name: 'Electricity',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'rental-brokerage',
    name: 'Rental brokerage',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'loan-interest',
    name: 'Loan interest',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: 'loan-principal',
    name: 'Loan principal',
    isTaxDeductible: false,
    isCapitalImprovement: false,
  },
  {
    key: 'loan-handling-fee',
    name: 'Loan handling fees',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
];

const GLOBAL_INCOME_TYPES: GlobalIncomeType[] = [
  {
    key: 'rental',
    name: 'Rental income',
    isTaxable: true,
  },
  {
    key: 'airbnb',
    name: 'Airbnb',
    isTaxable: true,
  },
  {
    key: 'capital-income',
    name: 'Capital income',
    isTaxable: true,
  },
  {
    key: 'insurance-compensation',
    name: 'Insurance compensation',
    isTaxable: true,
  },
];

@Injectable()
export class DefaultsSeeder implements OnModuleInit {
  private readonly logger = new Logger(DefaultsSeeder.name);

  constructor(
    @InjectRepository(ExpenseType)
    private expenseTypeRepository: Repository<ExpenseType>,
    @InjectRepository(IncomeType)
    private incomeTypeRepository: Repository<IncomeType>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedExpenseTypes();
    await this.seedIncomeTypes();
  }

  private async seedExpenseTypes(): Promise<void> {
    const count = await this.expenseTypeRepository.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding global expense types...');
    for (const typeData of GLOBAL_EXPENSE_TYPES) {
      const expenseType = new ExpenseType();
      expenseType.key = typeData.key;
      expenseType.name = typeData.name;
      expenseType.description = '';
      expenseType.isTaxDeductible = typeData.isTaxDeductible;
      expenseType.isCapitalImprovement = typeData.isCapitalImprovement;
      await this.expenseTypeRepository.save(expenseType);
    }
    this.logger.log(
      `Seeded ${GLOBAL_EXPENSE_TYPES.length} global expense types`,
    );
  }

  private async seedIncomeTypes(): Promise<void> {
    const count = await this.incomeTypeRepository.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding global income types...');
    for (const typeData of GLOBAL_INCOME_TYPES) {
      const incomeType = new IncomeType();
      incomeType.key = typeData.key;
      incomeType.name = typeData.name;
      incomeType.description = '';
      incomeType.isTaxable = typeData.isTaxable;
      await this.incomeTypeRepository.save(incomeType);
    }
    this.logger.log(`Seeded ${GLOBAL_INCOME_TYPES.length} global income types`);
  }
}
