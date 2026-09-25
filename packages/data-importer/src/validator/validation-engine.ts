import {
  ImporterSchema,
  ValidationError,
  ValidationSeverity,
  ValidationContext
} from '../types';
import { builtInValidators } from './built-in';
import { ValidationEngineError } from '../core/errors';

export interface ValidationSummary {
  errorsByCell: Record<string, ValidationError[]>; // key: `${rowId}:${field}`
  errorsByRow: Record<string, ValidationError[]>; // key: rowId
  warningsByCell: Record<string, ValidationError[]>;
  validRowsCount: number;
  invalidRowsCount: number;
  warningRowsCount: number;
  totalErrors: number;
  totalWarnings: number;
}

export class ValidationEngine {
  private schema: ImporterSchema;

  constructor(schema: ImporterSchema) {
    this.schema = schema;
  }

  /**
   * Validates all rows synchronously & asynchronously
   */
  async validateAll(
    rows: Record<string, unknown>[],
    rowIds: string[]
  ): Promise<ValidationSummary> {
    const errorsByCell: Record<string, ValidationError[]> = {};
    const errorsByRow: Record<string, ValidationError[]> = {};
    const warningsByCell: Record<string, ValidationError[]> = {};

    const invalidRowSet = new Set<string>();
    const warningRowSet = new Set<string>();

    let totalErrors = 0;
    let totalWarnings = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowId = rowIds[r] || String(r);

      for (const col of this.schema) {
        const field = col.key;
        const val = row[field];
        const cellKey = `${rowId}:${field}`;

        const issues = await this.validateField(val, row, field, r, rows, rowId);

        for (const issue of issues) {
          if (issue.severity === 'error') {
            totalErrors++;
            invalidRowSet.add(rowId);

            if (!errorsByCell[cellKey]) errorsByCell[cellKey] = [];
            errorsByCell[cellKey].push(issue);

            if (!errorsByRow[rowId]) errorsByRow[rowId] = [];
            errorsByRow[rowId].push(issue);
          } else if (issue.severity === 'warning') {
            totalWarnings++;
            warningRowSet.add(rowId);

            if (!warningsByCell[cellKey]) warningsByCell[cellKey] = [];
            warningsByCell[cellKey].push(issue);
          }
        }
      }
    }

    return {
      errorsByCell,
      errorsByRow,
      warningsByCell,
      validRowsCount: rows.length - invalidRowSet.size,
      invalidRowsCount: invalidRowSet.size,
      warningRowsCount: warningRowSet.size,
      totalErrors,
      totalWarnings
    };
  }

  /**
   * Validates a single cell value against column rules
   */
  async validateField(
    value: unknown,
    row: Record<string, unknown>,
    field: string,
    rowIndex: number,
    rows: Record<string, unknown>[] = [],
    rowId = String(rowIndex)
  ): Promise<ValidationError[]> {
    const col = this.schema.find((c) => c.key === field);
    if (!col) return [];

    const issues: ValidationError[] = [];
    const context: ValidationContext = {
      schema: this.schema,
      rows,
      field,
      rowIndex
    };

    // 1. Required check
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '');

    if (col.required && isEmpty) {
      issues.push({
        rowId,
        field,
        code: 'REQUIRED',
        message: `${col.label} is required`,
        severity: 'error',
        value
      });
      return issues; // Skip further type checks if required field is empty
    }

    // If empty and not required and nullable, skip further type checks
    if (isEmpty) {
      return issues;
    }

    // 2. Built-in type validations if not already added
    if (col.type === 'email') {
      const emailRule = builtInValidators.email();
      const res = emailRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    } else if (col.type === 'number') {
      const numRule = builtInValidators.number();
      const res = numRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    } else if (col.type === 'integer') {
      const intRule = builtInValidators.integer();
      const res = intRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    } else if (col.type === 'phone') {
      const phoneRule = builtInValidators.phone();
      const res = phoneRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    } else if (col.type === 'date' || col.type === 'datetime') {
      const dateRule = builtInValidators.date();
      const res = dateRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    } else if (col.type === 'enum' && col.options && col.options.length > 0) {
      const allowed = col.options.map((o) => o.value);
      const enumRule = builtInValidators.enum(allowed);
      const res = enumRule.validator(value, row, context);
      if (res && typeof res === 'object' && 'code' in res) {
        issues.push({ ...(res as ValidationError), rowId });
      }
    }

    // 3. User configured validators
    if (col.validators && col.validators.length > 0) {
      for (const rule of col.validators) {
        try {
          const res = rule.isAsync
            ? await rule.validator(value, row, context)
            : rule.validator(value, row, context);

          if (!res) continue;

          if (typeof res === 'boolean' && !res) {
            issues.push({
              rowId,
              field,
              code: rule.name.toUpperCase(),
              message: rule.message || `Validation failed for ${col.label}`,
              severity: rule.severity || 'error',
              value
            });
          } else if (typeof res === 'string') {
            issues.push({
              rowId,
              field,
              code: rule.name.toUpperCase(),
              message: res,
              severity: rule.severity || 'error',
              value
            });
          } else if (Array.isArray(res)) {
            for (const item of res) {
              issues.push({ ...item, rowId });
            }
          } else if (typeof res === 'object' && 'code' in res) {
            issues.push({ ...(res as ValidationError), rowId });
          }
        } catch (err: any) {
          issues.push({
            rowId,
            field,
            code: 'VALIDATION_EXCEPTION',
            message: `Validation exception in "${rule.name}": ${err?.message || 'Error'}`,
            severity: 'error',
            value
          });
        }
      }
    }

    return issues;
  }
}
