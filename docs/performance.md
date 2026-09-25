# Performance & Large Datasets

Handling large files (e.g. 10,000 to 50,000 rows) in a web browser without interface freezes requires disciplined memory and rendering strategies.

## Architectural Strategies

### 1. Row Virtualization
Rather than creating 50,000 DOM `<tr>` elements (which would overwhelm browser memory and destroy layout performance), Data Importer computes:
- Scroll offset `scrollTop`
- Viewport height `clientHeight`
- Row height `ROW_HEIGHT` (34px)
- Visible window + 10 overscan rows

Top and bottom spacing is maintained via spacer padding rows, allowing native smooth scroll physics while rendering fewer than 40 rows at any time.

### 2. Patch-Based History Manager
Naive spreadsheet implementations clone the entire array of 20,000 records on every single keystroke or edit. That would consume hundreds of megabytes in seconds.
Data Importer's `HistoryManager` records only the delta:
```ts
{
  type: 'cell_update',
  rowId: 'row_142',
  field: 'price',
  oldValue: 20.00,
  newValue: 25.00
}
```
Undo/redo is instantaneous and memory footprint remains negligible.

### 3. Delimiter Detection Sampling
CSV delimiter autodetection samples only the initial 10,000 bytes rather than analyzing entire 50MB files, ensuring parsing starts in milliseconds.
