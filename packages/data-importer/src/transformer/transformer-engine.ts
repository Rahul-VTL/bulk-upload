import { ImporterSchema, TransformRule } from '../types';
import { builtInTransformers } from './built-in';
import { TransformationError } from '../core/errors';

export class TransformerEngine {
  private schema: ImporterSchema;
  private customTransformers: Map<string, (args?: any) => TransformRule> = new Map();

  constructor(schema: ImporterSchema) {
    this.schema = schema;
  }

  registerTransformer(name: string, factory: (args?: any) => TransformRule): void {
    this.customTransformers.set(name, factory);
  }

  /**
   * Applies schema-defined transformers to all rows
   */
  transformRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const transformedRows: Record<string, unknown>[] = new Array(rows.length);

    for (let r = 0; r < rows.length; r++) {
      transformedRows[r] = this.transformRow(rows[r], r, rows);
    }

    return transformedRows;
  }

  /**
   * Applies transformers to a single row
   */
  transformRow(
    row: Record<string, unknown>,
    rowIndex: number,
    allRows: Record<string, unknown>[] = []
  ): Record<string, unknown> {
    const newRow: Record<string, unknown> = { ...row };

    for (const col of this.schema) {
      const field = col.key;
      let val = newRow[field];

      // Auto-cast based on column type if no custom transformers exist
      if (val !== undefined && val !== null && val !== '') {
        if (col.type === 'number' || col.type === 'integer') {
          if (typeof val === 'string') {
            const num = Number(val.replace(/[$€£¥₹\s,]/g, '').trim());
            if (!isNaN(num)) {
              val = col.type === 'integer' ? Math.floor(num) : num;
            }
          }
        } else if (col.type === 'boolean') {
          if (typeof val === 'string') {
            const lower = val.trim().toLowerCase();
            if (['true', '1', 'yes', 'y'].includes(lower)) val = true;
            else if (['false', '0', 'no', 'n'].includes(lower)) val = false;
          }
        }
      }

      // Run column-specific transformers
      if (col.transformers && col.transformers.length > 0) {
        for (const rule of col.transformers) {
          try {
            val = rule.transform(val, newRow, { field, rowIndex });
          } catch (err: any) {
            throw new TransformationError({
              code: 'TRANSFORMATION_FAILED',
              message: `Error applying transformer "${rule.name}" on field "${field}": ${err?.message || 'Transformation failed'}`,
              metadata: { field, rowIndex, rule: rule.name },
              cause: err
            });
          }
        }
      }

      newRow[field] = val;
    }

    return newRow;
  }

  /**
   * Transforms a single cell value
   */
  transformCell(
    field: string,
    value: unknown,
    row: Record<string, unknown>,
    rowIndex = 0
  ): unknown {
    const col = this.schema.find((c) => c.key === field);
    if (!col || !col.transformers || col.transformers.length === 0) {
      return value;
    }

    let val = value;
    for (const rule of col.transformers) {
      val = rule.transform(val, row, { field, rowIndex });
    }
    return val;
  }
}
