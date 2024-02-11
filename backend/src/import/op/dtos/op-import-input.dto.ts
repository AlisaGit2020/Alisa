import { IsNotEmpty, Matches, Min } from 'class-validator';

export class OpImportInput {
  @IsNotEmpty()
  file: string = '';
  /*Only for validation purposes*/
  @Matches(/(?:^$)|(?:^.+\.csv$)/, {
    message: 'Invalid file extension, use .csv-files.',
  })
  fileName: string = '';
  @Min(1)
  propertyId: number = 0;
  @Min(1)
  expenseTypeId: number = 0;
  @Min(1)
  incomeTypeId: number = 0;
}
