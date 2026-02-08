export class ImportResultDto {
  /** IDs of successfully imported transactions */
  savedIds: number[] = [];

  /** Number of rows skipped because they already exist and are accepted */
  skippedCount: number = 0;

  /** Total rows processed from the CSV file */
  totalRows: number = 0;
}
