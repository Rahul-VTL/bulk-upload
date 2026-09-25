# React Adapter & Hooks

The React adapter `data-importer/react` provides both a turnkey component (`<DataImporter>`) and a headless hook (`useDataImporter`).

## Option 1: `<DataImporter>` Component

```tsx
import React from 'react';
import { DataImporter } from 'data-importer/react';
import 'data-importer/styles.css';

export function MyImporter() {
  return (
    <DataImporter
      schema={schema}
      acceptedFiles={['csv', 'xlsx']}
      onImport={async (rows, onProgress) => {
        return await myApi.import(rows);
      }}
    />
  );
}
```

## Option 2: `useDataImporter` Headless Hook

If you wish to build your own completely custom UI layout while reusing the entire state machine, parsers, and validation:

```tsx
import React from 'react';
import { useDataImporter } from 'data-importer/react';

export function CustomImporterUI({ schema }) {
  const {
    state,
    loadFile,
    setMapping,
    confirmMappingAndPrepare,
    updateCell,
    undo,
    redo,
    import: runImport
  } = useDataImporter({
    schema,
    onImport: async (rows) => { ... }
  });

  return (
    <div>
      <input type="file" onChange={(e) => loadFile(e.target.files[0])} />
      <div>Current Step: {state.currentStep}</div>
      <div>Valid Records: {state.statistics.valid}</div>
      <button onClick={() => undo()} disabled={!state.canUndo}>Undo</button>
      <button onClick={() => redo()} disabled={!state.canRedo}>Redo</button>
      <button onClick={() => runImport()}>Import Now</button>
    </div>
  );
}
```
