import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { ExpenseTypeKey, IncomeTypeKey } from '@alisa-backend/common/types';

interface GlobalExpenseType {
  key: ExpenseTypeKey;
  isTaxDeductible: boolean;
  isCapitalImprovement: boolean;
}

interface GlobalIncomeType {
  key: IncomeTypeKey;
  isTaxable: boolean;
}

const GLOBAL_EXPENSE_TYPES: GlobalExpenseType[] = [
  {
    key: ExpenseTypeKey.HOUSING_CHARGE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.MAINTENANCE_CHARGE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.FINANCIAL_CHARGE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.REPAIRS,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.CAPITAL_IMPROVEMENT,
    isTaxDeductible: false,
    isCapitalImprovement: true,
  },
  {
    key: ExpenseTypeKey.INSURANCE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.PROPERTY_TAX,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.WATER,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.ELECTRICITY,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.RENTAL_BROKERAGE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.LOAN_INTEREST,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.LOAN_PRINCIPAL,
    isTaxDeductible: false,
    isCapitalImprovement: false,
  },
  {
    key: ExpenseTypeKey.LOAN_HANDLING_FEE,
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
];

const GLOBAL_INCOME_TYPES: GlobalIncomeType[] = [
  {
    key: IncomeTypeKey.RENTAL,
    isTaxable: true,
  },
  {
    key: IncomeTypeKey.AIRBNB,
    isTaxable: true,
  },
  {
    key: IncomeTypeKey.CAPITAL_INCOME,
    isTaxable: true,
  },
  {
    key: IncomeTypeKey.INSURANCE_COMPENSATION,
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
      incomeType.isTaxable = typeData.isTaxable;
      await this.incomeTypeRepository.save(incomeType);
    }
    this.logger.log(`Seeded ${GLOBAL_INCOME_TYPES.length} global income types`);
  }
}
