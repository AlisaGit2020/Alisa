import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import { ExpenseTypeService } from '@alisa-backend/accounting/expense/expense-type.service';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import { IncomeTypeService } from '@alisa-backend/accounting/income/income-type.service';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { JWTUser } from '@alisa-backend/auth/types';
import { OwnershipInputDto } from '@alisa-backend/people/ownership/dtos/ownership-input.dto';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { DataSource } from 'typeorm';

export const getUserAccessToken = async (
  authService: AuthService,
): Promise<string> => {
  return authService.login({
    firstName: 'Test',
    lastName: 'Tester',
    email: 'test@email.com',
  });
};

export const getUserAccessToken2 = async (
  authService: AuthService,
  user: JWTUser,
): Promise<string> => {
  return authService.login(user);
};

export const getBearerToken = (token: string): string => {
  return `Bearer ${token}`;
};

export const emptyTables = async (dataSource: DataSource) => {
  [
    'expense',
    'expense_type',
    'income',
    'income_type',
    'property',
    'transaction',
    'user',
    'ownership',
  ].map(async (tableName) => {
    await dataSource.query(
      `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
    );
  });
};

export const addProperty = async (
  service: PropertyService,
  name: string,
  size: number,
  user: JWTUser,
): Promise<Property> => {
  const inputProperty = new PropertyInputDto();
  inputProperty.name = name;
  inputProperty.size = size;

  const ownership = new OwnershipInputDto();
  ownership.share = 100;
  inputProperty.ownerships.push(ownership);

  return service.add(user, inputProperty);
};

export const addExpenseType = async (
  service: ExpenseTypeService,
  name: string,
  description: string = '',
  isTaxDeductible: boolean = false,
) => {
  const expenseType = new ExpenseTypeInputDto();
  expenseType.name = name;
  expenseType.description = description;
  expenseType.isTaxDeductible = isTaxDeductible;

  await service.add(expenseType);
};

export const addIncomeType = async (
  service: IncomeTypeService,
  name: string,
  description: string = '',
) => {
  const incomeType = new IncomeTypeInputDto();
  incomeType.name = name;
  incomeType.description = description;

  await service.add(incomeType);
};

export const sleep = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
