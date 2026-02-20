import {
  DataSaveResultDto,
  DataSaveResultRowDto,
} from '@alisa-backend/common/dtos/data-save-result.dto';

/**
 * Builds a DataSaveResultDto from an array of result row promises.
 * Used for bulk operations like deleteMany, where each item is processed independently.
 */
export async function buildBulkOperationResult(
  tasks: Promise<DataSaveResultRowDto>[],
  totalCount: number,
): Promise<DataSaveResultDto> {
  const results = await Promise.all(tasks);
  const successCount = results.filter((r) => r.statusCode === 200).length;
  const failedCount = results.filter((r) => r.statusCode !== 200).length;

  return {
    rows: {
      total: totalCount,
      success: successCount,
      failed: failedCount,
    },
    allSuccess: failedCount === 0,
    results,
  };
}

/**
 * Creates a success result row for bulk operations.
 */
export function createSuccessResult(id: number): DataSaveResultRowDto {
  return {
    id,
    statusCode: 200,
    message: 'OK',
  };
}

/**
 * Creates an unauthorized result row for bulk operations.
 */
export function createUnauthorizedResult(id: number): DataSaveResultRowDto {
  return {
    id,
    statusCode: 401,
    message: 'Unauthorized',
  };
}

/**
 * Creates an error result row for bulk operations.
 */
export function createErrorResult(
  id: number,
  error: Error & { status?: number },
): DataSaveResultRowDto {
  return {
    id,
    statusCode: error.status || 500,
    message: error.message,
  };
}
