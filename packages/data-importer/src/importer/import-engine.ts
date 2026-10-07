import {
  ImporterOptions,
  ImportProgress,
  ImportResult,
  ImportRowResult,
  ValidationError,
  ChunkMeta,
} from '../types';
import { ImportError } from '../core/errors';
import { uploadInChunks } from './chunk-uploader';

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
    onProgress?: (progress: ImportProgress) => void,
    meta?: {
      onlyValid?: boolean;
      originalTotalRows?: number;
      skippedInvalidCount?: number;
      skippedRowErrors?: Record<string, ValidationError[]>;
    }
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const totalRows = rows.length;
    const isOnlyValid = meta?.onlyValid ?? false;
    const originalTotal = meta?.originalTotalRows ?? totalRows;
    const skippedInvalid = meta?.skippedInvalidCount ?? 0;

    // Check error allowances (only if not running in onlyValid mode)
    const totalErrors = Object.keys(errors).length;
    const totalWarnings = Object.keys(warnings).length;

    if (!isOnlyValid && totalErrors > 0 && !this.options.allowImportWithErrors) {
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

    const skippedRowResults: ImportRowResult[] = [];
    if (meta?.skippedRowErrors) {
      for (const [rId, errList] of Object.entries(meta.skippedRowErrors)) {
        skippedRowResults.push({
          rowId: rId,
          success: false,
          error: errList.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join('; ')
        });
      }
    }

    const progress: ImportProgress = {
      processed: 0,
      total: totalRows,
      percentage: 0,
      successCount: 0,
      failureCount: 0
    };

    if (onProgress) onProgress({ ...progress });

    // Mode A: Dedicated chunk upload handler
    if (this.options.onUploadChunk) {
      try {
        const chunkSize = this.options.chunkSize || this.options.batchSize || 100;
        const uploadResult = await uploadInChunks(
          rows,
          async (chunk: Record<string, unknown>[], chunkMeta: ChunkMeta) => {
            return await this.options.onUploadChunk!(chunk, chunkMeta);
          },
          {
            chunkSize,
            onProgress: (p) => {
              if (onProgress) onProgress(p);
            },
          }
        );

        return {
          totalRows: isOnlyValid ? originalTotal : totalRows,
          validRows: isOnlyValid ? totalRows : totalRows - totalErrors,
          invalidRows: isOnlyValid ? skippedInvalid : totalErrors,
          warningRows: totalWarnings,
          importedRows: uploadResult.importedRows,
          failedRows: uploadResult.failedRows + (isOnlyValid ? skippedInvalid : 0),
          duration: Date.now() - startTime,
          rowResults: skippedRowResults.length > 0 ? skippedRowResults : undefined,
        };
      } catch (err: any) {
        throw new ImportError({
          code: 'CHUNK_UPLOAD_FAILED',
          message: `Chunk upload failed: ${err?.message || 'Server error'}`,
          cause: err,
        });
      }
    }

    // Mode B: onImport with chunked enabled
    if (this.options.onImport && this.options.chunked) {
      try {
        const chunkSize = this.options.chunkSize || this.options.batchSize || 100;
        const uploadResult = await uploadInChunks(
          rows,
          async (chunk: Record<string, unknown>[], _meta: ChunkMeta) => {
            return await this.options.onImport!(chunk, () => {});
          },
          {
            chunkSize,
            onProgress: (p) => {
              if (onProgress) onProgress(p);
            },
          }
        );

        return {
          totalRows: isOnlyValid ? originalTotal : totalRows,
          validRows: isOnlyValid ? totalRows : totalRows - totalErrors,
          invalidRows: isOnlyValid ? skippedInvalid : totalErrors,
          warningRows: totalWarnings,
          importedRows: uploadResult.importedRows,
          failedRows: uploadResult.failedRows + (isOnlyValid ? skippedInvalid : 0),
          duration: Date.now() - startTime,
          rowResults: skippedRowResults.length > 0 ? skippedRowResults : undefined,
        };
      } catch (err: any) {
        throw new ImportError({
          code: 'CHUNK_UPLOAD_FAILED',
          message: `Chunk upload failed: ${err?.message || 'Server error'}`,
          cause: err,
        });
      }
    }

    // Mode C: Standard onImport (single batch with progress callback)
    if (this.options.onImport) {
      try {
        const response = await this.options.onImport(rows, (p) => {
          if (onProgress) onProgress(p);
        });

        const duration = Date.now() - startTime;

        if (response && typeof response === 'object' && 'importedRows' in response) {
          const resp = response as ImportResult;
          return {
            ...resp,
            totalRows: isOnlyValid ? originalTotal : resp.totalRows ?? totalRows,
            validRows: isOnlyValid ? totalRows : resp.validRows ?? (totalRows - totalErrors),
            invalidRows: isOnlyValid ? skippedInvalid : resp.invalidRows ?? totalErrors,
            failedRows: (resp.failedRows ?? 0) + (isOnlyValid ? skippedInvalid : 0),
            rowResults: resp.rowResults
              ? [...resp.rowResults, ...skippedRowResults]
              : (skippedRowResults.length > 0 ? skippedRowResults : undefined),
            duration
          };
        }

        if (Array.isArray(response)) {
          // Consumer returned row-level results
          const rowResults = response as ImportRowResult[];
          const successCount = rowResults.filter((r) => r.success).length;
          const failureCount = rowResults.filter((r) => !r.success).length;

          return {
            totalRows: isOnlyValid ? originalTotal : totalRows,
            validRows: isOnlyValid ? totalRows : totalRows - totalErrors,
            invalidRows: isOnlyValid ? skippedInvalid : totalErrors,
            warningRows: totalWarnings,
            importedRows: successCount,
            failedRows: failureCount + (isOnlyValid ? skippedInvalid : 0),
            duration,
            rowResults: [...rowResults, ...skippedRowResults]
          };
        }

        // Consumer resolved with void / generic success
        return {
          totalRows: isOnlyValid ? originalTotal : totalRows,
          validRows: isOnlyValid ? totalRows : totalRows - totalErrors,
          invalidRows: isOnlyValid ? skippedInvalid : totalErrors,
          warningRows: totalWarnings,
          importedRows: totalRows,
          failedRows: isOnlyValid ? skippedInvalid : 0,
          duration,
          rowResults: skippedRowResults.length > 0 ? skippedRowResults : undefined
        };
      } catch (err: any) {
        throw new ImportError({
          code: 'IMPORT_CALLBACK_FAILED',
          message: `Import failed in application handler: ${err?.message || 'Unknown error'}`,
          cause: err
        });
      }
    }

    // Mode D: Default simulated chunk-by-chunk mock upload when onImport/onUploadChunk not supplied
    const chunkSize = this.options.chunkSize || 100;
    const uploadResult = await uploadInChunks(
      rows,
      async () => {
        // Small async delay per chunk
        await new Promise((r) => setTimeout(r, 120));
      },
      {
        chunkSize,
        onProgress: (p) => {
          if (onProgress) onProgress(p);
        },
      }
    );

    return {
      totalRows: isOnlyValid ? originalTotal : totalRows,
      validRows: isOnlyValid ? totalRows : totalRows - totalErrors,
      invalidRows: isOnlyValid ? skippedInvalid : totalErrors,
      warningRows: totalWarnings,
      importedRows: uploadResult.importedRows,
      failedRows: uploadResult.failedRows + (isOnlyValid ? skippedInvalid : 0),
      duration: Date.now() - startTime,
      rowResults: skippedRowResults.length > 0 ? skippedRowResults : undefined
    };
  }
}
