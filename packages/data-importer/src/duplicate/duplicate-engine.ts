import { ImporterSchema, ValidationError, DuplicateRuleConfig } from '../types';

export interface DuplicateDetectionResult {
  duplicateRowIds: Set<string>;
  duplicateErrors: ValidationError[];
  duplicateWarnings: ValidationError[];
}

export class DuplicateEngine {
  private schema: ImporterSchema;
  private externalCheckDuplicate?: (row: Record<string, unknown>) => boolean | Promise<boolean>;

  constructor(
    schema: ImporterSchema,
    externalCheckDuplicate?: (row: Record<string, unknown>) => boolean | Promise<boolean>
  ) {
    this.schema = schema;
    this.externalCheckDuplicate = externalCheckDuplicate;
  }

  /**
   * Detects internal and external duplicates across all rows
   */
  async detectDuplicates(
    rows: Record<string, unknown>[],
    rowIds: string[]
  ): Promise<DuplicateDetectionResult> {
    const duplicateRowIds = new Set<string>();
    const duplicateErrors: ValidationError[] = [];
    const duplicateWarnings: ValidationError[] = [];

    // Find all columns marked unique or with duplicate config
    const uniqueCols = this.schema.filter((c) => c.unique || c.duplicate);

    for (const col of uniqueCols) {
      const field = col.key;
      const config: DuplicateRuleConfig = col.duplicate || {};
      const strategy = config.strategy || 'reject';
      const compositeFields = config.compositeFields || [field];

      // Map from key string -> array of indices
      const keyMap = new Map<string, number[]>();

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        // Generate composite key
        const parts = compositeFields.map((f) => {
          const val = row[f];
          return val === null || val === undefined ? '' : String(val).trim().toLowerCase();
        });

        // If all parts are empty, don't flag as duplicate unless field is required
        if (parts.every((p) => p === '')) {
          continue;
        }

        const compositeKey = parts.join(':::');
        if (!keyMap.has(compositeKey)) {
          keyMap.set(compositeKey, []);
        }
        keyMap.get(compositeKey)!.push(r);
      }

      // Check duplicates in keyMap
      for (const [keyVal, indices] of keyMap.entries()) {
        if (indices.length <= 1) continue;

        let duplicateIndices: number[] = [];

        if (strategy === 'keep-first') {
          duplicateIndices = indices.slice(1);
        } else if (strategy === 'keep-last') {
          duplicateIndices = indices.slice(0, indices.length - 1);
        } else {
          // 'reject' or 'allow-warning' flags all occurrences or all except first
          duplicateIndices = indices.slice(1);
        }

        const isWarning = strategy === 'allow-warning';
        const severity = isWarning ? 'warning' : 'error';

        for (const idx of duplicateIndices) {
          const rowId = rowIds[idx] || String(idx);
          duplicateRowIds.add(rowId);

          const issue: ValidationError = {
            rowId,
            field,
            code: 'DUPLICATE_RECORD',
            message: `Duplicate record detected for ${compositeFields.join(' + ')} ("${keyVal.replace(/:::/g, ', ')}")`,
            severity,
            value: rows[idx][field]
          };

          if (isWarning) {
            duplicateWarnings.push(issue);
          } else {
            duplicateErrors.push(issue);
          }
        }
      }
    }

    // Check external duplicates if callback provided
    if (this.externalCheckDuplicate) {
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowId = rowIds[r] || String(r);

        try {
          const isExternalDup = await this.externalCheckDuplicate(row);
          if (isExternalDup) {
            duplicateRowIds.add(rowId);
            duplicateErrors.push({
              rowId,
              field: '_row',
              code: 'EXTERNAL_DUPLICATE',
              message: 'Record already exists in external application database',
              severity: 'error'
            });
          }
        } catch (err: any) {
          console.warn('External duplicate check error:', err);
        }
      }
    }

    return {
      duplicateRowIds,
      duplicateErrors,
      duplicateWarnings
    };
  }
}
