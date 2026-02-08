import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as crypto from 'crypto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { OpImportInput } from './dtos/op-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { TransactionStatus, TransactionType } from '@alisa-backend/common/types';
import { ImportResultDto } from '../dtos/import-result.dto';

@Injectable()
export class OpImportService {
  constructor(
    private transactionService: TransactionService,
    private propertyService: PropertyService,
    private authService: AuthService,
  ) {}

  async importCsv(
    user: JWTUser,
    options: OpImportInput,
  ): Promise<ImportResultDto> {
    await this.validate(user, options);
    const rows: CSVRow[] = await this.readCsv(options);
    return await this.saveRows(user, rows, options);
  }

  private async readCsv(options: OpImportInput): Promise<CSVRow[]> {
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

    return rows;
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

  private async saveRows(
    user: JWTUser,
    rows: CSVRow[],
    options: OpImportInput,
  ): Promise<ImportResultDto> {
    const result: ImportResultDto = {
      savedIds: [],
      skippedCount: 0,
      totalRows: rows.length,
    };

    for (const opCsvRow of rows) {
      const externalId = this.getExternalId(opCsvRow);

      // Check if transaction already exists and is accepted
      const existingTransaction = await this.findExistingTransaction(
        user,
        externalId,
      );

      if (
        existingTransaction &&
        existingTransaction.status === TransactionStatus.ACCEPTED
      ) {
        // Skip already accepted transactions
        result.skippedCount++;
        continue;
      }

      const transaction = await this.toTransaction(
        user,
        opCsvRow,
        options,
        existingTransaction?.id,
      );
      try {
        const saved = await this.transactionService.save(user, transaction);
        if (saved?.id) {
          result.savedIds.push(saved.id);
        }
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
    return result;
  }

  private async findExistingTransaction(
    user: JWTUser,
    externalId: string,
  ): Promise<{ id: number; status: TransactionStatus } | null> {
    const transactions = await this.transactionService.search(user, {
      select: ['id', 'status'],
      where: {
        externalId: externalId,
      },
    });

    return transactions[0] ?? null;
  }

  private async toTransaction(
    user: JWTUser,
    opCsvRow: CSVRow,
    options: OpImportInput,
    existingId?: number,
  ): Promise<TransactionInputDto> {
    const transaction = new TransactionInputDto();
    transaction.id = existingId;
    transaction.type = TransactionType.UNKNOWN;

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
