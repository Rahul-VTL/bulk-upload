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
   * Helper to retrieve field value safely handling key, label, alias, and case variations
   */
  private getFieldValue(row: Record<string, unknown>, fieldKey: string): unknown {
    if (!row) return undefined;
    if (row[fieldKey] !== undefined) {
      return row[fieldKey];
    }

    const lowerKey = fieldKey.toLowerCase();
    const foundKey = Object.keys(row).find((k) => k.toLowerCase() === lowerKey);
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey];
    }

    // Check schema definitions for aliases, label, and key
    const colDef = this.schema.find(
      (c) =>
        c.key.toLowerCase() === lowerKey ||
        c.label.toLowerCase() === lowerKey ||
        c.aliases?.some((a) => a.toLowerCase() === lowerKey)
    );

    if (colDef) {
      if (row[colDef.key] !== undefined) return row[colDef.key];
      if (row[colDef.label] !== undefined) return row[colDef.label];
      if (colDef.aliases) {
        for (const alias of colDef.aliases) {
          if (row[alias] !== undefined) return row[alias];
        }
      }
    }

    return undefined;
  }

  /**
   * Normalizes values for comparison (trims, collapses multiple spaces, case-insensitive)
   */
  private normalizeValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') {
      return val.trim().replace(/\s+/g, ' ').toLowerCase();
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val).trim().toLowerCase();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val).trim().toLowerCase();
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

    // 1. Find all columns explicitly marked unique or with duplicate config
    let uniqueCols = this.schema.filter((c) => c.unique || c.duplicate);

    // 2. If no column is explicitly configured, auto-detect natural identifier columns
    // (e.g. code, centre_code, id, email, sku, roll_no, etc.)
    if (uniqueCols.length === 0) {
      const naturalKeyPattern = /(id|code|sku|email|roll_?no|reg_?no|registration_?no)$/i;
      uniqueCols = this.schema.filter((c) => {
        if (c.unique === false) return false;
        const normalizedLabel = (c.label || '').trim().replace(/\s+/g, '_');
        return naturalKeyPattern.test(c.key) || naturalKeyPattern.test(normalizedLabel);
      });
    }

    // 3. Process each unique column / composite rule
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
          const val = this.getFieldValue(row, f);
          return this.normalizeValue(val);
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
          // 'reject' or 'allow-warning' flags all occurrences except first
          duplicateIndices = indices.slice(1);
        }

        const isWarning = strategy === 'allow-warning';
        const severity = isWarning ? 'warning' : 'error';

        for (const idx of duplicateIndices) {
          const rowId = rowIds[idx] || String(idx);
          duplicateRowIds.add(rowId);

          const rawVal = this.getFieldValue(rows[idx], field);
          const issue: ValidationError = {
            rowId,
            field,
            code: 'DUPLICATE_RECORD',
            message: `Duplicate record detected for ${compositeFields.join(' + ')} ("${keyVal.replace(/:::/g, ', ')}")`,
            severity,
            value: rawVal !== undefined ? rawVal : rows[idx][field]
          };

          if (isWarning) {
            duplicateWarnings.push(issue);
          } else {
            duplicateErrors.push(issue);
          }
        }
      }
    }

    // 4. Custom check per column if defined
    for (const col of this.schema) {
      if (col.duplicate?.customCheck) {
        const customCheckFn = col.duplicate.customCheck;
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const rowId = rowIds[r] || String(r);
          try {
            const isDup = await customCheckFn(row, rows);
            if (isDup) {
              duplicateRowIds.add(rowId);
              duplicateErrors.push({
                rowId,
                field: col.key,
                code: 'DUPLICATE_RECORD',
                message: `Duplicate record detected by custom rule for ${col.label || col.key}`,
                severity: 'error',
                value: this.getFieldValue(row, col.key)
              });
            }
          } catch (err) {
            console.warn(`Custom duplicate check error for ${col.key}:`, err);
          }
        }
      }
    }

    // 5. Full-row duplicate detection (catches identical rows not already flagged)
    const allSchemaKeys = this.schema.map((c) => c.key);
    if (allSchemaKeys.length > 0) {
      const fullRowMap = new Map<string, number[]>();
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowId = rowIds[r] || String(r);
        if (duplicateRowIds.has(rowId)) continue;

        const parts = allSchemaKeys.map((k) => this.normalizeValue(this.getFieldValue(row, k)));
        if (parts.every((p) => p === '')) continue;

        const fullKey = parts.join(':::');
        if (!fullRowMap.has(fullKey)) {
          fullRowMap.set(fullKey, []);
        }
        fullRowMap.get(fullKey)!.push(r);
      }

      for (const [_, indices] of fullRowMap.entries()) {
        if (indices.length <= 1) continue;
        const duplicateIndices = indices.slice(1);
        const firstIndex = indices[0];

        for (const idx of duplicateIndices) {
          const rowId = rowIds[idx] || String(idx);
          duplicateRowIds.add(rowId);

          const primaryField = allSchemaKeys[0] || '_row';
          const issue: ValidationError = {
            rowId,
            field: primaryField,
            code: 'DUPLICATE_RECORD',
            message: `Entire row is a duplicate of row #${firstIndex + 1}`,
            severity: 'error',
            value: this.getFieldValue(rows[idx], primaryField)
          };
          duplicateErrors.push(issue);
        }
      }
    }

    // 6. Check external duplicates if callback provided
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
