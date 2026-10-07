import * as XLSX from 'xlsx';
import { ValidationError } from '../types';

export interface ErrorExportItem {
  rowNumber: number;
  rowId: string;
  field: string;
  originalValue: string;
  errorCode: string;
  errorMessage: string;
  severity: string;
}

export class ErrorExporter {
  /**
   * Prepares structured error export items from validation errors
   */
  static prepareItems(
    errors: Record<string, ValidationError[]>,
    rows: Record<string, unknown>[],
    rowIds: string[]
  ): ErrorExportItem[] {
    const items: ErrorExportItem[] = [];
    const idToIndex = new Map<string, number>();
    rowIds.forEach((id, idx) => idToIndex.set(id, idx));

    for (const [key, errList] of Object.entries(errors)) {
      for (const err of errList) {
        const rowIndex = idToIndex.get(err.rowId) ?? -1;
        const rowNumber = rowIndex >= 0 ? rowIndex + 1 : 0;
        const origVal =
          rowIndex >= 0 && rows[rowIndex] && err.field in rows[rowIndex]
            ? String(rows[rowIndex][err.field] ?? '')
            : String(err.value ?? '');

        items.push({
          rowNumber,
          rowId: err.rowId,
          field: err.field,
          originalValue: origVal,
          errorCode: err.code,
          errorMessage: err.message,
          severity: err.severity
        });
      }
    }

    return items;
  }

  /**
   * Exports errors to CSV string
   */
  static toCsv(items: ErrorExportItem[]): string {
    const headers = [
      'Row Number',
      'Field',
      'Original Value',
      'Error Code',
      'Error Message',
      'Severity'
    ];

    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.join(',')];

    for (const item of items) {
      lines.push(
        [
          String(item.rowNumber),
          escapeCsv(item.field),
          escapeCsv(item.originalValue),
          escapeCsv(item.errorCode),
          escapeCsv(item.errorMessage),
          escapeCsv(item.severity)
        ].join(',')
      );
    }

    return lines.join('\r\n');
  }

  /**
   * Exports errors to XLSX buffer
   */
  static toXlsxBuffer(items: ErrorExportItem[]): Uint8Array {
    const data = items.map((it) => ({
      'Row Number': it.rowNumber,
      Field: it.field,
      'Original Value': it.originalValue,
      'Error Code': it.errorCode,
      'Error Message': it.errorMessage,
      Severity: it.severity
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');

    const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(out);
  }

  /**
   * Triggers browser download of error report
   */
  static download(
    format: 'csv' | 'xlsx',
    errors: Record<string, ValidationError[]>,
    rows: Record<string, unknown>[],
    rowIds: string[],
    filename = 'import-errors'
  ): void {
    const items = this.prepareItems(errors, rows, rowIds);
    if (items.length === 0) return;

    if (format === 'csv') {
      const csvStr = this.toCsv(items);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      this.triggerDownload(blob, `${filename}.csv`);
    } else {
      const u8 = this.toXlsxBuffer(items);
      const blob = new Blob([u8.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      this.triggerDownload(blob, `${filename}.xlsx`);
    }
  }

  /**
   * Downloads invalid rows as CSV or XLSX with original data values plus Error Reason column
   */
  static downloadInvalidRows(
    format: 'csv' | 'xlsx',
    errors: Record<string, ValidationError[]>,
    rowErrors: Record<string, ValidationError[]>,
    rows: Record<string, unknown>[],
    rowIds: string[],
    schema?: import('../types').ImporterSchema,
    filename = 'invalid-records'
  ): void {
    const idToIndex = new Map<string, number>();
    rowIds.forEach((id, idx) => idToIndex.set(id, idx));

    const invalidRowIds = new Set<string>();
    for (const rId of Object.keys(rowErrors || {})) {
      if (rowErrors[rId] && rowErrors[rId].length > 0) {
        invalidRowIds.add(rId);
      }
    }
    for (const cellKey of Object.keys(errors || {})) {
      if (errors[cellKey] && errors[cellKey].length > 0) {
        const rId = cellKey.split(':')[0];
        invalidRowIds.add(rId);
      }
    }

    if (invalidRowIds.size === 0) return;

    const data: Record<string, unknown>[] = [];
    const columns = schema ? schema.map((col) => ({ key: col.key, label: col.label || col.key })) : [];

    for (const rowId of invalidRowIds) {
      const idx = idToIndex.get(rowId);
      if (idx === undefined || !rows[idx]) continue;
      const row = rows[idx];

      const rowErrList = rowErrors?.[rowId] || [];
      const reasonMessages: string[] = [];
      const seenMessages = new Set<string>();

      for (const err of rowErrList) {
        const msg = `${err.field ? `${err.field}: ` : ''}${err.message}`;
        if (!seenMessages.has(msg)) {
          seenMessages.add(msg);
          reasonMessages.push(msg);
        }
      }

      if (reasonMessages.length === 0 && errors) {
        for (const [cellKey, errList] of Object.entries(errors)) {
          if (cellKey.startsWith(`${rowId}:`)) {
            for (const err of errList) {
              const msg = `${err.field ? `${err.field}: ` : ''}${err.message}`;
              if (!seenMessages.has(msg)) {
                seenMessages.add(msg);
                reasonMessages.push(msg);
              }
            }
          }
        }
      }

      const item: Record<string, unknown> = {};
      if (columns.length > 0) {
        for (const col of columns) {
          item[col.label] = row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : '';
        }
      } else {
        Object.assign(item, row);
      }
      item['Error Reason'] = reasonMessages.join('; ') || 'Validation error';
      data.push(item);
    }

    if (data.length === 0) return;

    if (format === 'csv') {
      const escapeCsv = (str: string) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const keys = Object.keys(data[0]);
      const lines = [keys.map(escapeCsv).join(',')];
      for (const rowObj of data) {
        lines.push(keys.map((k) => escapeCsv(String(rowObj[k] ?? ''))).join(','));
      }
      const csvStr = lines.join('\r\n');
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      this.triggerDownload(blob, `${filename}.csv`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid Records');
      const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const u8 = new Uint8Array(out);
      const blob = new Blob([u8.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      this.triggerDownload(blob, `${filename}.xlsx`);
    }
  }

  private static triggerDownload(blob: Blob, fileName: string): void {
    if (typeof window === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
