import { ChunkMeta, ImportProgress } from '../types';

export interface ChunkUploadOptions<T = Record<string, unknown>> {
  /** Size of each chunk, default 100 */
  chunkSize?: number;
  /** Max retries for a failed chunk upload, default 2 */
  retries?: number;
  /** Delay in milliseconds before retrying, default 500ms */
  retryDelayMs?: number;
  /** Callback fired as each chunk succeeds or fails with overall progress */
  onProgress?: (progress: ImportProgress) => void;
  /** Callback fired when a chunk succeeds */
  onChunkSuccess?: (chunk: T[], meta: ChunkMeta, response: any) => void;
  /** Callback fired when a chunk fails even after retries. Return true to continue with next chunk, or false to abort. Default: abort (false). */
  onChunkError?: (error: any, chunk: T[], meta: ChunkMeta) => boolean | Promise<boolean>;
}

export interface ChunkUploadResult {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  duration: number;
  errors: Array<{ chunkIndex: number; error: any }>;
}

/**
 * Splits an array into chunks of the specified size.
 */
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (!items || items.length === 0) return [];
  const size = Math.max(1, chunkSize);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Uploads an array of items to the server in sequential chunks with retry capability
 * and real-time progress reporting.
 */
export async function uploadInChunks<T = Record<string, unknown>>(
  items: T[],
  uploadFn: (chunk: T[], meta: ChunkMeta) => Promise<any>,
  options: ChunkUploadOptions<T> = {}
): Promise<ChunkUploadResult> {
  const startTime = Date.now();
  const totalRows = items.length;
  const chunkSize = Math.max(1, options.chunkSize || 100);
  const retries = Math.max(0, options.retries ?? 2);
  const retryDelayMs = Math.max(100, options.retryDelayMs ?? 500);

  if (totalRows === 0) {
    return {
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      totalChunks: 0,
      successfulChunks: 0,
      failedChunks: 0,
      duration: 0,
      errors: [],
    };
  }

  const chunks = chunkArray(items, chunkSize);
  const totalChunks = chunks.length;

  let processed = 0;
  let successCount = 0;
  let failureCount = 0;
  let successfulChunks = 0;
  let failedChunks = 0;
  const chunkErrors: Array<{ chunkIndex: number; error: any }> = [];

  // Report initial 0% progress
  options.onProgress?.({
    processed: 0,
    total: totalRows,
    percentage: 0,
    successCount: 0,
    failureCount: 0,
    currentChunk: 1,
    totalChunks,
    chunkSize,
  });

  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunks[i];
    const startIndex = i * chunkSize;
    const endIndex = Math.min(startIndex + chunk.length, totalRows);
    const meta: ChunkMeta = {
      chunkIndex: i + 1,
      totalChunks,
      startIndex,
      endIndex,
      totalRows,
    };

    let attempt = 0;
    let chunkSuccess = false;
    let lastError: any = null;
    let chunkResponse: any = null;

    while (attempt <= retries && !chunkSuccess) {
      try {
        chunkResponse = await uploadFn(chunk, meta);
        chunkSuccess = true;
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt <= retries) {
          // Linear backoff
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
      }
    }

    if (chunkSuccess) {
      successfulChunks++;
      successCount += chunk.length;
      processed += chunk.length;
      options.onChunkSuccess?.(chunk, meta, chunkResponse);
    } else {
      failedChunks++;
      failureCount += chunk.length;
      processed += chunk.length;
      chunkErrors.push({ chunkIndex: i + 1, error: lastError });

      // Determine whether to continue or abort
      const shouldContinue = options.onChunkError
        ? await options.onChunkError(lastError, chunk, meta)
        : false;

      if (!shouldContinue) {
        // Report final progress before throwing
        const percentage = Math.round((processed / totalRows) * 100);
        options.onProgress?.({
          processed,
          total: totalRows,
          percentage,
          successCount,
          failureCount,
          currentChunk: i + 1,
          totalChunks,
          chunkSize,
        });

        const errorMsg =
          lastError?.message || `Failed to upload chunk ${i + 1} of ${totalChunks} after ${retries + 1} attempts.`;
        const abortErr: any = new Error(errorMsg);
        abortErr.chunkIndex = i + 1;
        abortErr.cause = lastError;
        throw abortErr;
      }
    }

    // Report progress after chunk completion
    const percentage = Math.round((processed / totalRows) * 100);
    options.onProgress?.({
      processed,
      total: totalRows,
      percentage,
      successCount,
      failureCount,
      currentChunk: Math.min(i + 1, totalChunks),
      totalChunks,
      chunkSize,
    });
  }

  return {
    totalRows,
    importedRows: successCount,
    failedRows: failureCount,
    totalChunks,
    successfulChunks,
    failedChunks,
    duration: Date.now() - startTime,
    errors: chunkErrors,
  };
}
