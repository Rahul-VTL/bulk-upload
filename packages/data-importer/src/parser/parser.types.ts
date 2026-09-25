import { SheetInfo } from '../types';

export interface ParseOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  selectedSheetId?: string;
  maxRows?: number;
  skipEmptyLines?: boolean;
}

export interface ParseResult {
  sheets: SheetInfo[];
  selectedSheetId: string;
  headers: string[];
  rawRows: Record<string, unknown>[];
  totalRawRows: number;
}

export interface FileParser {
  supports(file: File | { name: string; type?: string }): boolean;
  parse(file: File | ArrayBuffer | string, options?: ParseOptions): Promise<ParseResult>;
}
