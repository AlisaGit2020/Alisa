import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import * as crypto from 'crypto';
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto';
import { SPankkiImportInput } from './dtos/s-pankki-import-input.dto';
import { JWTUser } from '@alisa-backend/auth/types';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { TransactionType } from '@alisa-backend/common/types';

@Injectable()
export class SPankkiImportService {
  constructor(
    private transactionService: TransactionService,
    private propertyService: PropertyService,
    private authService: AuthService,
  ) {}

  async importCsv(user: JWTUser, options: SPankkiImportInput): Promise<number[]> {
    await this.validate(user, options);
    const rows: CSVRow[] = await this.readCsv(options);
    return await this.saveRows(user, rows, options);
  }

  private async readCsv(options: SPankkiImportInput): Promise<CSVRow[]> {
    const rows: CSVRow[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(options.file, { encoding: 'utf-8' })
        .pipe(csvParser({ separator: ';', headers: false }))
        .on('data', (data: string[]) => {
          // Skip header row (check for Finnish header text)
          if (data[10] !== 'Arkistointitunnus') {
            const mappedData: CSVRow = {
              datePosted: data[0],
              valueDate: data[1],
              amount: data[2],
              type: data[3],
              payer: data[4],
              payeeName: data[5],
              payeeAccountNumber: data[6],
              payeeBIC: data[7],
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

  private async validate(user: JWTUser, options: SPankkiImportInput) {
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
    options: SPankkiImportInput,
  ): Promise<number[]> {
    const savedIds: number[] = [];
    for (const csvRow of rows) {
      const transaction = await this.toTransaction(user, csvRow, options);
      try {
        const saved = await this.transactionService.save(user, transaction);
        if (saved?.id) {
          savedIds.push(saved.id);
        }
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
    return savedIds;
  }

  private async getTransactionId(
    user: JWTUser,
    csvRow: CSVRow,
  ): Promise<number | undefined> {
    const transactions = await this.transactionService.search(user, {
      where: {
        externalId: this.getExternalId(csvRow),
      },
    });

    return transactions[0]?.id ?? undefined;
  }

  private async toTransaction(
    user: JWTUser,
    csvRow: CSVRow,
    options: SPankkiImportInput,
  ): Promise<TransactionInputDto> {
    const transaction = new TransactionInputDto();
    transaction.id = await this.getTransactionId(user, csvRow);
    transaction.type = TransactionType.UNKNOWN;

    if (this.isExpense(csvRow)) {
      // Expense - payer is the user, payee receives money
      transaction.sender = csvRow.payer;
      transaction.receiver = csvRow.payeeName;
    } else {
      // Income - payer sends money, payee is the user
      transaction.sender = csvRow.payer;
      transaction.receiver = csvRow.payeeName;
    }

    transaction.propertyId = options.propertyId;
    transaction.externalId = this.getExternalId(csvRow);
    transaction.description = this.getMessagePart(csvRow.message);
    transaction.transactionDate = this.parseDate(csvRow.datePosted);
    transaction.accountingDate = this.parseDate(csvRow.datePosted);
    transaction.amount = this.getAmount(csvRow);

    return transaction;
  }

  /**
   * Parse Finnish date format (DD.MM.YYYY) to Date object
   */
  private parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('.');
    return new Date(`${year}-${month}-${day}`);
  }

  private getAmount(csvRow: CSVRow): number {
    // S-Pankki uses comma as decimal separator and may have + or - prefix
    return Number(csvRow.amount.replace(',', '.').replace('+', ''));
  }

  private getExternalId(csvRow: CSVRow): string {
    const concatenatedString = Object.values(csvRow).join('');

    return crypto.createHash('sha256').update(concatenatedString).digest('hex');
  }

  private isExpense(csvRow: CSVRow): boolean {
    const amount = Number(csvRow.amount.replace(',', '.').replace('+', ''));
    return amount < 0;
  }

  private getMessagePart(inputString: string): string | null {
    // S-Pankki message is wrapped in single quotes, remove them
    let message = inputString.replace(/^'|'$/g, '');

    // Check for "Viesti: " prefix pattern
    const regex = /Viesti: (.*)/;
    const match = message.match(regex);
    return match ? match[1] : message;
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
  payer: string;
  payeeName: string;
  payeeAccountNumber: string;
  payeeBIC: string;
  reference: string;
  message: string;
  archiveID: string;
};