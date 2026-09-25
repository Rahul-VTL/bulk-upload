# Typed Event System

Data Importer exposes an event bus for observability, external logging, and telemetry without locking into any specific monitoring provider.

## Listening to Events

```ts
import { createImporter } from 'data-importer';

const importer = createImporter({ schema });

// Subscribe to typed events
const unsubscribe = importer.on('fileParsed', ({ sheets, headers, rowCount }) => {
  console.log(`Parsed ${rowCount} rows across ${sheets.length} sheets.`);
});

importer.on('validationCompleted', ({ validCount, errorCount, warningCount }) => {
  console.log(`Validation finished: ${validCount} valid, ${errorCount} errors.`);
});

importer.on('importCompleted', ({ result }) => {
  console.log('Import successful in', result.duration, 'ms');
});
```

## Available Events

| Event Name | Payload Description |
|---|---|
| `fileSelected` | `{ file: File }` |
| `fileParsed` | `{ sheets: SheetInfo[], headers: string[], rowCount: number }` |
| `sheetSelected` | `{ sheetId: string }` |
| `mappingStarted` | `void` |
| `mappingCompleted` | `{ mappings: ColumnMapping[] }` |
| `mappingChanged` | `{ mapping: ColumnMapping }` |
| `transformationStarted`| `void` |
| `transformationCompleted`| `{ rowCount: number }` |
| `validationStarted` | `void` |
| `validationCompleted` | `{ validCount: number, errorCount: number, warningCount: number }` |
| `duplicateDetectionCompleted` | `{ duplicateCount: number }` |
| `rowUpdated` | `{ rowId: string, field: string, oldValue: unknown, newValue: unknown }` |
| `rowsUpdated` | `{ rowIds: string[], changes: Record<string, unknown> }` |
| `rowsDeleted` | `{ rowIds: string[] }` |
| `rowsAdded` | `{ rows: Record<string, unknown>[] }` |
| `importStarted` | `{ totalRows: number }` |
| `importProgress` | `ImportProgress` (`processed`, `total`, `percentage`, `successCount`, `failureCount`) |
| `importCompleted` | `{ result: ImportResult }` |
| `importFailed` | `{ error: Error }` |
| `errorExported` | `{ format: 'csv' \| 'xlsx', count: number }` |
| `reset` | `void` |
| `stateChanged` | `{ state: ImporterState }` |
