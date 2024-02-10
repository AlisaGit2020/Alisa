import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import { ExpenseService } from '@alisa-backend/accounting/expense/expense.service';
import { IncomeService } from '@alisa-backend/accounting/income/income.service';

@Injectable()
export class OpImportService {
  constructor(
    @Inject(ExpenseService)
    private expenseService: ExpenseService,
    @Inject(IncomeService)
    private incomeService: IncomeService,
  ) {}

  async importCsv(options: OpImportOptions) {
    const rows: CSVRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(options.csvFile, { encoding: 'utf-8' })
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

  private async handleRows(rows: CSVRow[], options: OpImportOptions) {
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
        transaction: { externalId: opCsvRow.archiveID },
      },
    });

    return expenses[0]?.id ?? undefined;
  }

  private async getIncomeId(opCsvRow: CSVRow): Promise<number | undefined> {
    const incomes = await this.incomeService.search({
      where: {
        transaction: { externalId: opCsvRow.archiveID },
      },
    });

    return incomes[0]?.id ?? undefined;
  }

  private async toExpense(
    opCsvRow: CSVRow,
    options: OpImportOptions,
  ): Promise<ExpenseInputDto> {
    const expense = new ExpenseInputDto();
    expense.id = await this.getExpenseId(opCsvRow);
    expense.expenseTypeId = this.getExpenseTypeId(options, opCsvRow);
    expense.propertyId = options.propertyId;
    expense.transaction = this.toTransaction(opCsvRow);
    return expense;
  }

  private async toIncome(
    opCsvRow: CSVRow,
    options: OpImportOptions,
  ): Promise<IncomeInputDto> {
    const income = new IncomeInputDto();
    income.id = await this.getIncomeId(opCsvRow);
    income.incomeTypeId = this.getIncomeTypeId(options, opCsvRow);
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

    transaction.externalId = opCsvRow.archiveID;
    transaction.description = this.getMessagePart(opCsvRow.message);
    transaction.transactionDate = new Date(opCsvRow.valueDate);
    transaction.accountingDate = new Date(opCsvRow.valueDate);
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

  private getExpenseTypeId(options: OpImportOptions, opCsvRow: CSVRow): number {
    return options.expenseTypeId;
  }

  private getIncomeTypeId(options: OpImportOptions, opCsvRow: CSVRow): number {
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

export type OpImportOptions = {
  csvFile: string;
  propertyId: number;
  expenseTypeId: number;
  incomeTypeId: number;
};
