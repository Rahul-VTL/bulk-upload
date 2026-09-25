# Error System & Export

Data Importer provides a unified error model across parsers, mapping, transformations, validators, and import steps.

## Typed Error Classes

All exceptions inherit from `ImporterError`:

```ts
import {
  ImporterError,
  FileError,
  ParserError,
  MappingError,
  TransformationError,
  ValidationEngineError,
  ImportError
} from 'data-importer';
```

Each error provides:
- `code`: Stable string identifier (e.g. `FILE_TOO_LARGE`, `INVALID_EMAIL`, `DUPLICATE_RECORD`).
- `message`: User-friendly human readable explanation.
- `severity`: `'error' | 'warning' | 'info'`.
- `metadata`: Contextual details (e.g. `fileSize`, `rowIndex`, `field`).

## Exporting Validation Errors

Users can export error diagnostics at any time during data review:
- Formats: **CSV** or **XLSX**.
- Output includes: Row Number, Field, Original Value, Error Code, Error Message, Severity.

Programmatic trigger:

```ts
importer.exportErrors('csv');
// or
importer.exportErrors('xlsx');
```
