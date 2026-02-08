import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseTypeDefault } from './entities/expense-type-default.entity';
import { IncomeTypeDefault } from './entities/income-type-default.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import { UserService } from '@alisa-backend/people/user/user.service';
import { UserInputDto } from '@alisa-backend/people/user/dtos/user-input.dto';

@Injectable()
export class UserDefaultsService {
  private readonly logger = new Logger(UserDefaultsService.name);

  constructor(
    @InjectRepository(ExpenseTypeDefault)
    private expenseTypeDefaultRepository: Repository<ExpenseTypeDefault>,
    @InjectRepository(IncomeTypeDefault)
    private incomeTypeDefaultRepository: Repository<IncomeTypeDefault>,
    @InjectRepository(ExpenseType)
    private expenseTypeRepository: Repository<ExpenseType>,
    @InjectRepository(IncomeType)
    private incomeTypeRepository: Repository<IncomeType>,
    private userService: UserService,
  ) {}

  async initializeDefaults(
    userId: number,
    language: string,
  ): Promise<void> {
    try {
      const existingCount = await this.expenseTypeRepository.count({
        where: { userId },
      });
      if (existingCount > 0) {
        return;
      }

      const lang = this.normalizeLanguage(language);

      const loanSettingMap = await this.createExpenseTypes(userId, lang);
      await this.createIncomeTypes(userId, lang);
      await this.mapLoanSettings(userId, loanSettingMap);
    } catch (error) {
      this.logger.error(
        `Failed to initialize defaults for user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private normalizeLanguage(language: string): string {
    if (!language) {
      return 'fi';
    }
    const lang = language.split(/[-_]/)[0].toLowerCase();
    return lang === 'fi' ? 'fi' : 'en';
  }

  private async createExpenseTypes(
    userId: number,
    lang: string,
  ): Promise<Record<string, number>> {
    const defaults = await this.expenseTypeDefaultRepository.find();
    const loanSettingMap: Record<string, number> = {};

    for (const template of defaults) {
      const expenseType = new ExpenseType();
      expenseType.userId = userId;
      expenseType.name = lang === 'fi' ? template.nameFi : template.nameEn;
      expenseType.description = '';
      expenseType.isTaxDeductible = template.isTaxDeductible;
      expenseType.isCapitalImprovement = template.isCapitalImprovement;

      const saved = await this.expenseTypeRepository.save(expenseType);

      if (template.loanSettingKey) {
        loanSettingMap[template.loanSettingKey] = saved.id;
      }
    }

    return loanSettingMap;
  }

  private async createIncomeTypes(
    userId: number,
    lang: string,
  ): Promise<void> {
    const defaults = await this.incomeTypeDefaultRepository.find();

    for (const template of defaults) {
      const incomeType = new IncomeType();
      incomeType.userId = userId;
      incomeType.name = lang === 'fi' ? template.nameFi : template.nameEn;
      incomeType.description = '';
      incomeType.isTaxable = template.isTaxable;

      await this.incomeTypeRepository.save(incomeType);
    }
  }

  private async mapLoanSettings(
    userId: number,
    loanSettingMap: Record<string, number>,
  ): Promise<void> {
    if (Object.keys(loanSettingMap).length === 0) {
      return;
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      return;
    }

    if (loanSettingMap.interest) {
      user.loanInterestExpenseTypeId = loanSettingMap.interest;
    }
    if (loanSettingMap.principal) {
      user.loanPrincipalExpenseTypeId = loanSettingMap.principal;
    }
    if (loanSettingMap.handlingFee) {
      user.loanHandlingFeeExpenseTypeId = loanSettingMap.handlingFee;
    }

    await this.userService.update(userId, user as UserInputDto);
  }
}
