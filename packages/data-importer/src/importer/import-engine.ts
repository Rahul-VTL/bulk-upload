import {
  ImporterOptions,
  ImportProgress,
  ImportResult,
  ImportRowResult,
  ValidationError
} from '../types';
import { ImportError } from '../core/errors';

export class ImportEngine {
  private options: ImporterOptions;

  constructor(options: ImporterOptions) {
    this.options = options;
  }

  async executeImport(
    rows: Record<string, unknown>[],
    rowIds: string[],
    errors: Record<string, ValidationError[]>,
    warnings: Record<string, ValidationError[]>,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const totalRows = rows.length;

    // Check error allowances
    const totalErrors = Object.keys(errors).length;
    const totalWarnings = Object.keys(warnings).length;

    if (totalErrors > 0 && !this.options.allowImportWithErrors) {
      throw new ImportError({
        code: 'IMPORT_INVALID_ROWS_EXIST',
        message: `Cannot import: ${totalErrors} invalid cell(s) remain. Please correct errors or configure allowImportWithErrors: true.`
      });
    }

    if (totalWarnings > 0 && this.options.allowImportWithWarnings === false) {
      throw new ImportError({
        code: 'IMPORT_WARNING_ROWS_EXIST',
        message: `Cannot import: ${totalWarnings} warnings exist. Please resolve warnings or allow warnings in configuration.`
      });
    }

    const progress: ImportProgress = {
      processed: 0,
      total: totalRows,
      percentage: 0,
      successCount: 0,
      failureCount: 0
    };

    if (onProgress) onProgress({ ...progress });

    if (!this.options.onImport) {
      // Default mock completion if consumer did not pass onImport
      progress.processed = totalRows;
      progress.successCount = totalRows;
      progress.percentage = 100;
      if (onProgress) onProgress({ ...progress });

      return {
        totalRows,
        validRows: totalRows - totalErrors,
        invalidRows: totalErrors,
        warningRows: totalWarnings,
        importedRows: totalRows,
        failedRows: 0,
        duration: Date.now() - startTime
      };
    }

    // Call consumer callback with progress reporting
    try {
      const response = await this.options.onImport(rows, (p) => {
        if (onProgress) onProgress(p);
      });

      const duration = Date.now() - startTime;

      if (response && typeof response === 'object' && 'importedRows' in response) {
        return {
          ...response,
          duration
        };
      }

      if (Array.isArray(response)) {
        // Consumer returned row-level results
        const rowResults = response as ImportRowResult[];
        const successCount = rowResults.filter((r) => r.success).length;
        const failureCount = rowResults.filter((r) => !r.success).length;

        return {
          totalRows,
          validRows: totalRows - totalErrors,
          invalidRows: totalErrors,
          warningRows: totalWarnings,
          importedRows: successCount,
          failedRows: failureCount,
          duration,
          rowResults
        };
      }

      // Consumer resolved with void / generic success
      return {
        totalRows,
        validRows: totalRows - totalErrors,
        invalidRows: totalErrors,
        warningRows: totalWarnings,
        importedRows: totalRows,
        failedRows: 0,
        duration
      };
    } catch (err: any) {
      throw new ImportError({
        code: 'IMPORT_CALLBACK_FAILED',
        message: `Import failed in application handler: ${err?.message || 'Unknown error'}`,
        cause: err
      });
    }
  }
}
