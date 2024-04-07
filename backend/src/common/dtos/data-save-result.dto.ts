export class DataSaveResultDto {
  rows: {
    total: number;
    success: number;
    failed: number;
  } = {
    total: 0,
    success: 0,
    failed: 0,
  };
  allSuccess: boolean;
  results: DataSaveResultRowDto[];
}
export class DataSaveResultRowDto {
  id: number;
  statusCode: number;
  message: string;
}
