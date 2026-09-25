import * as XLSX from 'xlsx';
import { ParserError } from '../../core/errors';
import { SheetInfo } from '../../types';
import { FileParser, ParseOptions, ParseResult } from '../parser.types';
import { detectHeaders, sanitizeHeaders } from '../header-detector';

export class XlsxParser implements FileParser {
  supports(file: File | { name: string; type?: string }): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm');
  }

  async parse(file: File | ArrayBuffer | string, options?: ParseOptions): Promise<ParseResult> {
    const data = await this.readBuffer(file);
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        cellText: false,
        raw: true
      });
    } catch (err: any) {
      throw new ParserError({
        code: 'PARSER_EXCEL_CORRUPT',
        message: `Failed to parse Excel workbook: ${err?.message || 'Corrupt or unreadable spreadsheet file.'}`,
        cause: err
      });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new ParserError({
        code: 'PARSER_NO_SHEETS',
        message: 'The uploaded Excel file contains no worksheets.'
      });
    }

    // Inspect all sheets
    const sheets: SheetInfo[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const range = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']) : null;
      const rowCount = range ? range.e.r - range.s.r : 0;
      const colCount = range ? range.e.c - range.s.c + 1 : 0;

      // Extract sample
      const rawMatrix: unknown[][] = sheet
        ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
        : [];

      const stringMatrix = rawMatrix.map((row) =>
        (Array.isArray(row) ? row : []).map((val) => this.formatCellValue(val))
      );

      sheets.push({
        id: sheetName,
        name: sheetName,
        rowCount: Math.max(0, stringMatrix.length > 0 ? stringMatrix.length - 1 : rowCount),
        columnCount: colCount || (stringMatrix[0]?.length ?? 0),
        sampleRows: this.matrixToSampleRows(stringMatrix)
      });
    }

    // Selected sheet logic
    const selectedSheetId =
      options?.selectedSheetId && workbook.SheetNames.includes(options.selectedSheetId)
        ? options.selectedSheetId
        : workbook.SheetNames[0];

    const targetSheet = workbook.Sheets[selectedSheetId];
    if (!targetSheet) {
      throw new ParserError({
        code: 'PARSER_SHEET_NOT_FOUND',
        message: `Sheet "${selectedSheetId}" was not found in workbook.`
      });
    }

    const rawMatrix: unknown[][] = XLSX.utils.sheet_to_json(targetSheet, {
      header: 1,
      defval: '',
      blankrows: !(options?.skipEmptyLines ?? true)
    });

    const stringMatrix = rawMatrix.map((row) =>
      (Array.isArray(row) ? row : []).map((val) => this.formatCellValue(val))
    );

    if (stringMatrix.length === 0) {
      return {
        sheets,
        selectedSheetId,
        headers: [],
        rawRows: [],
        totalRawRows: 0
      };
    }

    const { headers, dataRows } = detectHeaders(stringMatrix, options?.hasHeaders ?? true);
    const sanitizedHeaders = sanitizeHeaders(headers);

    const rawRows: Record<string, unknown>[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const rowArr = dataRows[i];
      const isBlank = rowArr.every((c) => c === '' || c === null || c === undefined);
      if (isBlank && (options?.skipEmptyLines ?? true)) {
        continue;
      }

      const rowObj: Record<string, unknown> = {};
      for (let h = 0; h < sanitizedHeaders.length; h++) {
        rowObj[sanitizedHeaders[h]] = rowArr[h] !== undefined ? rowArr[h] : '';
      }
      rawRows.push(rowObj);
    }

    // Update sheet row count with actual non-empty data rows
    const currSheet = sheets.find((s) => s.id === selectedSheetId);
    if (currSheet) {
      currSheet.rowCount = rawRows.length;
      currSheet.columnCount = sanitizedHeaders.length;
    }

    return {
      sheets,
      selectedSheetId,
      headers: sanitizedHeaders,
      rawRows,
      totalRawRows: rawRows.length
    };
  }

  private matrixToSampleRows(matrix: string[][]): Record<string, unknown>[] {
    if (matrix.length <= 1) return [];
    const headers = sanitizeHeaders(matrix[0]);
    const samples: Record<string, unknown>[] = [];
    for (let r = 1; r < Math.min(matrix.length, 6); r++) {
      const rowObj: Record<string, unknown> = {};
      for (let c = 0; c < headers.length; c++) {
        rowObj[headers[c]] = matrix[r][c] ?? '';
      }
      samples.push(rowObj);
    }
    return samples;
  }

  private formatCellValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return String(val);
  }

  private async readBuffer(file: File | ArrayBuffer | string): Promise<ArrayBuffer> {
    if (file instanceof ArrayBuffer) return file;
    if (typeof file === 'string') {
      const encoder = new TextEncoder();
      return encoder.encode(file).buffer as ArrayBuffer;
    }
    return file.arrayBuffer();
  }
}
