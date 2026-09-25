import { CsvParser } from '../csv/csv-parser';
import { FileParser, ParseOptions, ParseResult } from '../parser.types';

export class TsvParser implements FileParser {
  private csvParser = new CsvParser('\t');

  supports(file: File | { name: string; type?: string }): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.tsv') || name.endsWith('.tab');
  }

  async parse(file: File | ArrayBuffer | string, options?: ParseOptions): Promise<ParseResult> {
    return this.csvParser.parse(file, {
      ...options,
      delimiter: '\t'
    });
  }
}
