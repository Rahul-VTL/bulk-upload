import { ParserError } from '../../core/errors';
import { FileParser, ParseOptions, ParseResult } from '../parser.types';
import { detectHeaders, sanitizeHeaders } from '../header-detector';

export class CsvParser implements FileParser {
  private defaultDelimiter: string;

  constructor(defaultDelimiter = ',') {
    this.defaultDelimiter = defaultDelimiter;
  }

  supports(file: File | { name: string; type?: string }): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.txt');
  }

  async parse(file: File | ArrayBuffer | string, options?: ParseOptions): Promise<ParseResult> {
    const text = await this.readText(file);
    if (!text || text.trim().length === 0) {
      throw new ParserError({
        code: 'PARSER_EMPTY_CONTENT',
        message: 'The CSV document contains no data.'
      });
    }

    // Strip BOM
    const cleanText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

    const delimiter = options?.delimiter || this.detectDelimiter(cleanText) || this.defaultDelimiter;
    const records = this.parseRfc4180(cleanText, delimiter);

    if (records.length === 0) {
      throw new ParserError({
        code: 'PARSER_NO_RECORDS',
        message: 'No valid records found in CSV file.'
      });
    }

    const { headers, dataRows } = detectHeaders(records, options?.hasHeaders ?? true);
    const sanitizedHeaders = sanitizeHeaders(headers);

    const rawRows: Record<string, unknown>[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const rowArr = dataRows[i];
      // Check if row is completely blank
      const isBlank = rowArr.every((cell) => cell === '' || cell === null || cell === undefined);
      if (isBlank && (options?.skipEmptyLines ?? true)) {
        continue;
      }

      const rowObj: Record<string, unknown> = {};
      for (let h = 0; h < sanitizedHeaders.length; h++) {
        const headerName = sanitizedHeaders[h];
        rowObj[headerName] = rowArr[h] !== undefined ? rowArr[h] : '';
      }
      rawRows.push(rowObj);
    }

    const sheetName = 'Sheet1';
    return {
      sheets: [
        {
          id: sheetName,
          name: sheetName,
          rowCount: rawRows.length,
          columnCount: sanitizedHeaders.length,
          sampleRows: rawRows.slice(0, 5)
        }
      ],
      selectedSheetId: sheetName,
      headers: sanitizedHeaders,
      rawRows,
      totalRawRows: rawRows.length
    };
  }

  /**
   * RFC 4180 compliant character-by-character state machine
   */
  public parseRfc4180(text: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    const len = text.length;

    for (let i = 0; i < len; i++) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            currentCell += '"';
            i++; // skip next quote
          } else {
            // Closing quote
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\r') {
          if (nextChar === '\n') {
            i++; // Skip \n in \r\n
          }
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else if (char === '\n') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    // Flush remaining
    if (inQuotes) {
      // Unclosed quote: still flush what we have gracefully
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    // Filter trailing empty row if last line was just empty
    if (
      rows.length > 0 &&
      rows[rows.length - 1].length === 1 &&
      rows[rows.length - 1][0] === ''
    ) {
      rows.pop();
    }

    return rows;
  }

  /**
   * Autodetects delimiter based on frequencies of candidate characters in the first lines
   */
  public detectDelimiter(sampleText: string): string {
    const candidates = [',', ';', '\t', '|'];
    const lines = sampleText.slice(0, 10000).split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return ',';

    const firstFew = lines.slice(0, Math.min(5, lines.length));
    let bestDelimiter = ',';
    let bestScore = -1;

    for (const cand of candidates) {
      const counts = firstFew.map((line) => {
        let count = 0;
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') inQ = !inQ;
          else if (!inQ && line[i] === cand) count++;
        }
        return count;
      });

      // Delimiter should occur consistently across lines and count > 0
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      if (minCount > 0) {
        // High consistency and higher frequency
        const consistencyBonus = minCount === maxCount ? 100 : 0;
        const score = minCount * 10 + consistencyBonus;
        if (score > bestScore) {
          bestScore = score;
          bestDelimiter = cand;
        }
      }
    }

    return bestDelimiter;
  }

  private async readText(file: File | ArrayBuffer | string): Promise<string> {
    if (typeof file === 'string') return file;
    if (file instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(file);
    }
    if (file && typeof (file as any).text === 'function') {
      return (file as any).text();
    }
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(
            new ParserError({
              code: 'PARSER_READ_FAILED',
              message: `Failed to read file: ${reader.error?.message || 'Unknown read error'}`
            })
          );
        reader.readAsText(file);
      });
    }
    throw new ParserError({
      code: 'PARSER_ENV_UNSUPPORTED',
      message: 'Environment does not support file reading (missing file.text() and FileReader).'
    });
  }
}
