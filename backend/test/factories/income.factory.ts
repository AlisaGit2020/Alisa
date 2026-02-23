import { Income } from '@asset-backend/accounting/income/entities/income.entity';
import { IncomeType } from '@asset-backend/accounting/income/entities/income-type.entity';
import { IncomeTypeKey } from '@asset-backend/common/types';

export interface CreateIncomeOptions {
  id?: number;
  propertyId?: number;
  transactionId?: number;
  incomeTypeId?: number;
  description?: string;
  amount?: number;
  quantity?: number;
  totalAmount?: number;
  accountingDate?: Date | null;
}

export const createIncome = (options: CreateIncomeOptions = {}): Income => {
  const income = new Income();
  income.id = options.id ?? 1;
  income.propertyId = options.propertyId ?? 1;
  income.transactionId = options.transactionId !== undefined ? options.transactionId : 1;
  income.incomeTypeId = options.incomeTypeId ?? 1;
  income.description = options.description ?? 'Test Income';
  income.amount = options.amount ?? 100;
  income.quantity = options.quantity ?? 1;
  income.totalAmount = options.totalAmount ?? 100;
  if (options.accountingDate !== undefined) {
    income.accountingDate = options.accountingDate;
  }
  return income;
};

export interface CreateIncomeTypeOptions {
  id?: number;
  key?: IncomeTypeKey;
  isTaxable?: boolean;
}

export const createIncomeType = (
  options: CreateIncomeTypeOptions = {},
): IncomeType => {
  const incomeType = new IncomeType();
  incomeType.id = options.id ?? 1;
  incomeType.key = options.key ?? IncomeTypeKey.RENTAL;
  incomeType.isTaxable = options.isTaxable ?? true;
  return incomeType;
};
