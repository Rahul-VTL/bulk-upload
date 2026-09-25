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
