import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';

@Injectable()
export class OpService {
  async importCsv(filePath: string) {
    const results: CSVRow[] = [];

    try {
      fs.createReadStream(filePath, { encoding: 'utf-8' }) // Lisätty utf-8 koodauksen määrittely
        .pipe(csvParser({ separator: ';' })) // Lisätty erottimen määrittely
        .on('data', (data: CSVRow) => {
          results.push(data);
        })
        .on('end', () => {
          console.log('CSV file successfully processed.');
          console.log('Rows:', results);
        });
    } catch (error) {
      console.error('Error reading CSV file:', error);
    }
  }
}

type CSVRow = {
  Kirjauspäivä: string;
  Arvopäivä: string;
  'Määrä EUROA': string;
  Laji: string;
  Selitys: string;
  'Saaja/Maksaja': string;
  'Saajan tilinumero': string;
  'Saajan pankin BIC': string;
  Viite: string;
  Viesti: string;
  Arkistointitunnus: string;
};
