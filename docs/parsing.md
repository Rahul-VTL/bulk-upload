# File Parsers

Data Importer provides robust, standards-compliant client-side file parsers with support for CSV, TSV, XLS, and XLSX.

## Supported Formats

- **CSV (`.csv`, `.txt`)**: RFC 4180 compliant state-machine parser.
- **TSV (`.tsv`, `.tab`)**: Tab-delimited spreadsheet parser.
- **XLS / XLSX (`.xlsx`, `.xls`, `.xlsm`)**: Multi-sheet Excel workbook parser.

## CSV & TSV Parser Features

Unlike naive `split(",")` approaches, the parser handles:
- **Escaped quotes**: Double quotes inside quoted fields (`"He said ""Hello"""` → `He said "Hello"`).
- **Embedded newlines**: Multiline cells within quotes without row splitting.
- **Byte Order Marks (BOM)**: Automatic UTF-8 BOM (`\uFEFF`) detection and stripping.
- **Delimiter Autodetection**: Automatically discovers comma (`,`), semicolon (`;`), tab (`\t`), or pipe (`|`) based on consistency scoring across sample lines.
- **Unicode & Special Symbols**: Preserves international character sets, currency symbols, and emojis.

## Excel Parsing & Multi-Sheet Selection

When an Excel workbook is parsed:
1. All worksheets are identified.
2. The importer calculates row count, column count, and extracts sample data for each sheet.
3. If more than 1 worksheet exists, the UI presents an interactive sheet selector card grid with previews so the user can choose the correct sheet.

## Custom Parser Registration

You can register custom file parsers using `ParserRegistry`:

```ts
import { FileParser, ParseResult } from 'data-importer';

export class CustomJsonParser implements FileParser {
  supports(file: File): boolean {
    return file.name.endsWith('.json');
  }

  async parse(file: File): Promise<ParseResult> {
    const text = await file.text();
    const data = JSON.parse(text);
    const headers = Object.keys(data[0] || {});

    return {
      sheets: [{ id: 'default', name: 'JSON Records', rowCount: data.length, columnCount: headers.length }],
      selectedSheetId: 'default',
      headers,
      rawRows: data,
      totalRawRows: data.length
    };
  }
}
```
