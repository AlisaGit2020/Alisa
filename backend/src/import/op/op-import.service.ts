import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as crypto from 'crypto';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { ExpenseService } from '@alisa-backend/accounting/expense/expense.service';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';
import { OpImportInput } from './dtos/op-import-input.dto';

@Injectable()
export class OpImportService {
  constructor(
    @Inject(ExpenseService)
    private expenseService: ExpenseService,
    @Inject(IncomeService)
    private incomeService: IncomeService,
  ) {}

  async importCsv(options: OpImportInput) {
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

    await this.handleRows(rows, options);
  }

  private async handleRows(rows: CSVRow[], options: OpImportInput) {
    for (const opCsvRow of rows) {
      if (this.isExpense(opCsvRow)) {
        const expense = await this.toExpense(opCsvRow, options);
        try {
          await this.expenseService.save(expense);
        } catch (error: unknown) {
          this.handleError(error);
        }
      } else {
        const income = await this.toIncome(opCsvRow, options);
        try {
          await this.incomeService.save(income);
        } catch (error: unknown) {
          this.handleError(error);
        }
      }
    }
  }

  private async getExpenseId(opCsvRow: CSVRow): Promise<number | undefined> {
    const expenses = await this.expenseService.search({
      where: {
        transaction: { externalId: this.getExternalId(opCsvRow) },
      },
    });

    return expenses[0]?.id ?? undefined;
  }

  private async getIncomeId(opCsvRow: CSVRow): Promise<number | undefined> {
    const incomes = await this.incomeService.search({
      where: {
        transaction: { externalId: this.getExternalId(opCsvRow) },
      },
    });

    return incomes[0]?.id ?? undefined;
  }

  private async toExpense(
    opCsvRow: CSVRow,
    options: OpImportInput,
  ): Promise<ExpenseInputDto> {
    const expense = new ExpenseInputDto();
    expense.id = await this.getExpenseId(opCsvRow);
    expense.expenseTypeId = this.getExpenseTypeId(options);
    expense.propertyId = options.propertyId;
    expense.transaction = this.toTransaction(opCsvRow);
    return expense;
  }

  private async toIncome(
    opCsvRow: CSVRow,
    options: OpImportInput,
  ): Promise<IncomeInputDto> {
    const income = new IncomeInputDto();
    income.id = await this.getIncomeId(opCsvRow);
    income.incomeTypeId = this.getIncomeTypeId(options);
    income.propertyId = options.propertyId;
    income.transaction = this.toTransaction(opCsvRow);
    return income;
  }

  private toTransaction(opCsvRow: CSVRow): TransactionInputDto {
    const transaction = new TransactionInputDto();

    if (this.isExpense(opCsvRow)) {
      //Expense
      transaction.sender = 'Juha Koivisto';
      transaction.receiver = opCsvRow.payerPayee;
    } else {
      //Income
      transaction.sender = opCsvRow.payerPayee;
      transaction.receiver = 'Juha Koivisto';
    }

    transaction.externalId = this.getExternalId(opCsvRow);
    transaction.description = this.getMessagePart(opCsvRow.message);
    transaction.transactionDate = new Date(opCsvRow.datePosted);
    transaction.accountingDate = new Date(opCsvRow.datePosted);
    transaction.amount = this.getAmount(opCsvRow);
    transaction.quantity = 1;
    transaction.totalAmount = transaction.amount;

    return transaction;
  }

  private getAmount(opCsvRow: CSVRow): number {
    const amount = Number(opCsvRow.amount.replace(',', '.'));
    if (this.isExpense(opCsvRow)) {
      return amount * -1;
    }
    return amount;
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
