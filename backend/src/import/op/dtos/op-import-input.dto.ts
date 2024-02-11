import { Min } from 'class-validator';

export class OpImportInput {
  file: string = '';
  @Min(1)
  propertyId: number = 0;
  @Min(1)
  expenseTypeId: number = 0;
  @Min(1)
  incomeTypeId: number = 0;
}
