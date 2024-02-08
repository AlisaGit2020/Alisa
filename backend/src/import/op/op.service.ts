import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';

@Injectable()
export class OpService {
  async importCsv(filePath: string) {
    const results: CSVRow[] = [];

    try {
      fs.createReadStream(filePath, { encoding: 'utf-8' }) // Lisätty utf-8 koodauksen määrittely
        .pipe(csvParser({ separator: ';', headers: false })) // Lisätty headers: false
        .on('data', (data: string[]) => {
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

          results.push(mappedData);
        })
        .on('end', () => {
          console.log('CSV file successfully processed.');
          console.log('Rows:', results);
        });
    } catch (error) {
      console.error('Error reading CSV file:', error);
    }
  }

  getMessagePart(inputString: string): string | null {
    const regex = /Viesti: (\w+)/;
    const match = inputString.match(regex);

    return match ? match[1] : null;
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
