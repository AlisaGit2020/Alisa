import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseTypeDefault } from './entities/expense-type-default.entity';
import { IncomeTypeDefault } from './entities/income-type-default.entity';

const DEFAULT_EXPENSE_TYPES: Partial<ExpenseTypeDefault>[] = [
  {
    nameFi: 'Yhtiövastike',
    nameEn: 'Housing company charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Hoitovastike',
    nameEn: 'Maintenance charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Rahoitusvastike',
    nameEn: 'Financial charge',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Korjaukset',
    nameEn: 'Repairs',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Perusparannus',
    nameEn: 'Capital improvement',
    isTaxDeductible: false,
    isCapitalImprovement: true,
  },
  {
    nameFi: 'Vakuutukset',
    nameEn: 'Insurance',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Kiinteistövero',
    nameEn: 'Property tax',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Vesimaksu',
    nameEn: 'Water fee',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Sähkö',
    nameEn: 'Electricity',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Vuokranvälitys',
    nameEn: 'Rental brokerage',
    isTaxDeductible: true,
    isCapitalImprovement: false,
  },
  {
    nameFi: 'Lainan korko',
    nameEn: 'Loan interest',
    isTaxDeductible: true,
    isCapitalImprovement: false,
    loanSettingKey: 'interest',
  },
  {
    nameFi: 'Lainan lyhennys',
    nameEn: 'Loan principal',
    isTaxDeductible: false,
    isCapitalImprovement: false,
    loanSettingKey: 'principal',
  },
  {
    nameFi: 'Lainan käsittelykulut',
    nameEn: 'Loan handling fees',
    isTaxDeductible: true,
    isCapitalImprovement: false,
    loanSettingKey: 'handlingFee',
  },
];

const DEFAULT_INCOME_TYPES: Partial<IncomeTypeDefault>[] = [
  {
    nameFi: 'Vuokratulo',
    nameEn: 'Rental income',
    isTaxable: true,
  },
  {
    nameFi: 'Airbnb',
    nameEn: 'Airbnb',
    isTaxable: true,
  },
  {
    nameFi: 'Pääomatulo',
    nameEn: 'Capital income',
    isTaxable: true,
  },
  {
    nameFi: 'Vakuutuskorvaus',
    nameEn: 'Insurance compensation',
    isTaxable: true,
  },
];

@Injectable()
export class DefaultsSeeder implements OnModuleInit {
  private readonly logger = new Logger(DefaultsSeeder.name);

  constructor(
    @InjectRepository(ExpenseTypeDefault)
    private expenseTypeDefaultRepository: Repository<ExpenseTypeDefault>,
    @InjectRepository(IncomeTypeDefault)
    private incomeTypeDefaultRepository: Repository<IncomeTypeDefault>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedExpenseTypeDefaults();
    await this.seedIncomeTypeDefaults();
  }

  private async seedExpenseTypeDefaults(): Promise<void> {
    const count = await this.expenseTypeDefaultRepository.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding default expense types...');
    await this.expenseTypeDefaultRepository.save(DEFAULT_EXPENSE_TYPES);
    this.logger.log(`Seeded ${DEFAULT_EXPENSE_TYPES.length} default expense types`);
  }

  private async seedIncomeTypeDefaults(): Promise<void> {
    const count = await this.incomeTypeDefaultRepository.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding default income types...');
    await this.incomeTypeDefaultRepository.save(DEFAULT_INCOME_TYPES);
    this.logger.log(`Seeded ${DEFAULT_INCOME_TYPES.length} default income types`);
  }
}
