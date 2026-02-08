import { IsNotEmpty, Matches, Min } from 'class-validator';

export class SPankkiImportInput {
  @IsNotEmpty()
  file: string = '';
  /*Only for validation purposes*/
  @Matches(/(?:^$)|(?:^.+\.csv$)/, {
    message: 'Invalid file extension, use .csv-files.',
  })
  fileName?: string = '';

  @Min(1)
  propertyId: number = 0;
}