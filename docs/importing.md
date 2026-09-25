# Importing & Progress Tracking

Data Importer is strictly consumer-controlled. The library never calls backend APIs directly, stores credentials, or knows your network topology.

## Import Callback Workflow

When the user confirms final import:
1. The importer validates error thresholds (blocking import if invalid cells exist and `allowImportWithErrors: false`).
2. Calls the consumer-provided `onImport(rows, onProgress)` callback.
3. Renders a live progress indicator.
4. Transitions to the completion screen showing duration, success count, and failure breakdown.

## Implementation Example

```tsx
<DataImporter
  schema={schema}
  onImport={async (rows, onProgress) => {
    const total = rows.length;
    const batchSize = 100;

    for (let i = 0; i < total; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      await fetch('/api/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch })
      });

      const processed = Math.min(i + batchSize, total);
      onProgress({
        processed,
        total,
        percentage: Math.round((processed / total) * 100),
        successCount: processed,
        failureCount: 0
      });
    }

    return {
      totalRows: total,
      validRows: total,
      invalidRows: 0,
      warningRows: 0,
      importedRows: total,
      failedRows: 0,
      duration: 1200
    };
  }}
  onComplete={(result) => {
    console.log('Finished import:', result);
  }}
/>
```

## Row-Level Failure Reporting

If some rows fail backend validation, the consumer can return row-level results:

```ts
return [
  { rowId: 'row_1', success: true },
  { rowId: 'row_2', success: false, error: 'Database record already exists' }
];
```
The result screen will display the exact row failures and allow exporting them for inspection.
