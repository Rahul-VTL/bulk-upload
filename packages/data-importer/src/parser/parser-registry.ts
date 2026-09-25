import { FileParser } from './parser.types';
import { CsvParser } from './csv/csv-parser';
import { TsvParser } from './tsv/tsv-parser';
import { XlsxParser } from './xlsx/xlsx-parser';
import { ParserError } from '../core/errors';

export class ParserRegistry {
  private parsers: FileParser[] = [];

  constructor() {
    // Register built-in default parsers
    this.register(new CsvParser());
    this.register(new TsvParser());
    this.register(new XlsxParser());
  }

  register(parser: FileParser, prepend = false): void {
    if (prepend) {
      this.parsers.unshift(parser);
    } else {
      this.parsers.push(parser);
    }
  }

  getParser(file: File | { name: string; type?: string }): FileParser {
    for (const parser of this.parsers) {
      if (parser.supports(file)) {
        return parser;
      }
    }
    throw new ParserError({
      code: 'PARSER_NOT_FOUND',
      message: `No suitable parser found for file "${file.name}".`
    });
  }

  getAll(): FileParser[] {
    return [...this.parsers];
  }
}
