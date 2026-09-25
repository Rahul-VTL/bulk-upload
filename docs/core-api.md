# Core Headless API Reference

The core headless controller `DataImporterCore` exposes complete control over the entire preparation pipeline without any framework dependency.

## Instantiation

```ts
import { createImporter } from 'data-importer';

const importer = createImporter({
  schema: [...],
  acceptedFiles: ['csv', 'xlsx'],
  maxFileSize: 50 * 1024 * 1024,
  allowImportWithErrors: false,
  allowImportWithWarnings: true,
  checkDuplicate: async (row) => false,
  onImport: async (rows, onProgress) => { ... }
});
```

## Methods Reference

### Lifecycle & Loading
- `loadFile(file: File): Promise<void>`: Validates file and invokes parsing.
- `selectSheet(sheetId: string): Promise<void>`: Selects sheet in a multi-sheet workbook.
- `reset(): void`: Resets all internal states, history, and selections to initial step.
- `destroy(): void`: Cleans up memory listeners and subscribers.

### Mapping & Preparation
- `autoMap(): void`: Reruns automatic column matching against source headers.
- `setMapping(sourceColumn: string, targetField: string | null): void`: Manually remaps or ignores a column.
- `confirmMappingAndPrepare(): Promise<void>`: Converts raw matrix into schema records, applies transformations, and runs validation.

### Grid & Data Editing
- `updateCell(rowId: string, field: string, value: unknown): void`: Edits cell value, triggers transforms, saves undo patch, and revalidates row.
- `updateCells(changes: Array<{ rowId, field, value }>): void`: Bulk updates multiple cells.
- `addRow(data?: Record<string, unknown>, atIndex?: number): string`: Inserts a new record.
- `duplicateRow(rowId: string): string | null`: Clones an existing row.
- `deleteRows(rowIds: string[]): void`: Deletes specified rows and records action in history stack.
- `undo(): void`: Reverts last grid change.
- `redo(): void`: Reapplies undone grid change.

### Query, Selection & Errors
- `setFilter(filter: FilterGroup | null): void`: Sets active nested AND/OR filter group.
- `setSearch(query: string): void`: Sets global search query across visible columns.
- `setSorting(sortRules: SortRule[]): void`: Applies multi-column stable sorting.
- `toggleRowSelection(rowId: string, force?: boolean): void`: Toggles row selection checkbox.
- `selectAllRows(): void`: Selects all filtered rows.
- `clearSelection(): void`: Clears row selection.
- `exportErrors(format: 'csv' | 'xlsx'): void`: Triggers browser file download of all error records.

### Submission
- `import(): Promise<ImportResult>`: Executes the import engine with progress tracking.
