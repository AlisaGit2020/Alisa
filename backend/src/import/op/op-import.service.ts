import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as crypto from 'crypto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { ExpenseService } from '@alisa-backend/accounting/expense/expense.service';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';
import { OpImportInput } from './dtos/op-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';

@Injectable()
export class OpImportService {
  constructor(
    private expenseService: ExpenseService,
    private incomeService: IncomeService,
    private transactionService: TransactionService,
    private propertyService: PropertyService,
    private authService: AuthService,
  ) {}

  async importCsv(user: JWTUser, options: OpImportInput) {
    await this.validate(user, options);

    const rows: CSVRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(options.file, { encoding: 'utf-8' })
        .pipe(csvParser({ separator: ';', headers: false }))
        .on('data', (data: string[]) => {
          if (data[10] !== 'Arkistointitunnus') {
            const mappedData: CSVRow = {
              datePosted: data[0],
              valueDate: data[1],
              amount: data[2],
              type: data[3],
              description: data[4],
              payerPayee: data[5],
              accountNumber: data[6],
              bankBIC: data[7],
              reference: data[8],
              message: data[9],
              archiveID: data[10],
            };

            rows.push(mappedData);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await this.handleRows(user, rows, options);
  }

  private async validate(user: JWTUser, options: OpImportInput) {
    const property = await this.propertyService.findOne(
      user,
      options.propertyId,
    );

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!(await this.authService.hasOwnership(user, options.propertyId))) {
      throw new UnauthorizedException();
    }
  }

  private async handleRows(
    user: JWTUser,
    rows: CSVRow[],
    options: OpImportInput,
  ) {
    for (const opCsvRow of rows) {
      const transaction = await this.toTransaction(user, opCsvRow, options);
      try {
        const savedTransaction = await this.transactionService.save(
          user,
          transaction,
        );

        if (this.isExpense(opCsvRow)) {
          const expense = await this.toExpense(user, opCsvRow, options);
          expense.transactionId = savedTransaction.id;
          try {
            await this.expenseService.save(user, expense);
          } catch (error: unknown) {
            this.handleError(error);
          }
        } else {
          const income = await this.toIncome(user, opCsvRow, options);
          income.transactionId = savedTransaction.id;
          try {
            await this.incomeService.save(user, income);
          } catch (error: unknown) {
            this.handleError(error);
          }
        }
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
  }

  private async getTransactionId(
    user: JWTUser,
    opCsvRow: CSVRow,
  ): Promise<number | undefined> {
    const transactions = await this.transactionService.search(user, {
      where: {
        externalId: this.getExternalId(opCsvRow),
      },
    });

    return transactions[0]?.id ?? undefined;
  }

  private async getExpenseId(
    user: JWTUser,
    opCsvRow: CSVRow,
  ): Promise<number | undefined> {
    const expenses = await this.expenseService.search(user, {
      where: {
        transaction: { externalId: this.getExternalId(opCsvRow) },
      },
    });

    return expenses[0]?.id ?? undefined;
  }

  private async getIncomeId(
    user: JWTUser,
    opCsvRow: CSVRow,
  ): Promise<number | undefined> {
    const incomes = await this.incomeService.search(user, {
      where: {
        transaction: { externalId: this.getExternalId(opCsvRow) },
      },
    });

    return incomes[0]?.id ?? undefined;
  }

  private async toExpense(
    user: JWTUser,
    opCsvRow: CSVRow,
    options: OpImportInput,
  ): Promise<ExpenseInputDto> {
    const expense = new ExpenseInputDto();
    expense.id = await this.getExpenseId(user, opCsvRow);
    expense.description = this.getMessagePart(opCsvRow.message);
    expense.amount = this.getAmount(opCsvRow);
    expense.quantity = 1;
    expense.totalAmount = expense.amount * expense.quantity * -1; //positive amount
    expense.expenseTypeId = this.getExpenseTypeId(options);
    expense.propertyId = options.propertyId;
    expense.transaction = undefined;
    return expense;
  }

  private async toIncome(
    user: JWTUser,
    opCsvRow: CSVRow,
    options: OpImportInput,
  ): Promise<IncomeInputDto> {
    const income = new IncomeInputDto();
    income.id = await this.getIncomeId(user, opCsvRow);
    income.description = this.getMessagePart(opCsvRow.message);
    income.amount = this.getAmount(opCsvRow);
    income.quantity = 1;
    income.totalAmount = income.amount * income.quantity;
    income.incomeTypeId = this.getIncomeTypeId(options);
    income.propertyId = options.propertyId;
    income.transaction = undefined;
    return income;
  }

  private async toTransaction(
    user: JWTUser,
    opCsvRow: CSVRow,
    options: OpImportInput,
  ): Promise<TransactionInputDto> {
    const transaction = new TransactionInputDto();
    transaction.id = await this.getTransactionId(user, opCsvRow);

    if (this.isExpense(opCsvRow)) {
      //Expense
      transaction.sender = 'Juha Koivisto';
      transaction.receiver = opCsvRow.payerPayee;
    } else {
      //Income
      transaction.sender = opCsvRow.payerPayee;
      transaction.receiver = 'Juha Koivisto';
    }

    transaction.propertyId = options.propertyId;
    transaction.externalId = this.getExternalId(opCsvRow);
    transaction.description = this.getMessagePart(opCsvRow.message);
    transaction.transactionDate = new Date(opCsvRow.datePosted);
    transaction.accountingDate = new Date(opCsvRow.datePosted);
    transaction.amount = this.getAmount(opCsvRow);

    return transaction;
  }

  private getAmount(opCsvRow: CSVRow): number {
    return Number(opCsvRow.amount.replace(',', '.'));
  }

  private getExternalId(opCsvRow: CSVRow): string {
    const concatenatedString = Object.values(opCsvRow).join('');

    return crypto.createHash('sha256').update(concatenatedString).digest('hex');
  }

  private getExpenseTypeId(options: OpImportInput): number {
    return options.expenseTypeId;
  }

  private getIncomeTypeId(options: OpImportInput): number {
    return options.incomeTypeId;
  }

  private isExpense(opCsvRow: CSVRow): boolean {
    const amount = Number(opCsvRow.amount.replace(',', '.'));
    return amount < 0;
  }

  private getMessagePart(inputString: string): string | null {
    const regex = /Viesti: (.*)/;
    const match = inputString.match(regex);
    return match ? match[1] : inputString;
  }

  private handleError(error: unknown) {
    console.log(error);
  }
}

type CSVRow = {
  datePosted: string;
  valueDate: string;
  amount: string;
  type: string;
  description: string;
  payerPayee: string;
  accountNumber: string;
  bankBIC: string;
  reference: string;
  message: string;
  archiveID: string;
};
