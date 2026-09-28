# React Adapter, Hooks & Headless Architecture

The React adapter `data-importer/react` provides both a turnkey component (`<DataImporter>`) and headless primitives (`useDataImporter`, `DataImporterProvider`, `useDataImporterContext`).

---

## Mode 1: Default Turnkey UI (`<DataImporter>`)

Zero configuration required. Comes with standard stepper, drag-and-drop zone, worksheet selector, fuzzy column mapper, virtualized spreadsheet grid, error diagnostics, and progress bar:

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

---

## Mode 2: Headless Hook (`useDataImporter`)

If you want 100% custom UI (e.g., Tailwind CSS, Ant Design, Chakra UI, MUI, Shadcn UI) with zero default DOM or CSS:

```tsx
import React from 'react';
import { useDataImporter } from 'data-importer/react';

export function CustomImporterUI({ schema }) {
  const {
    state,
    loadFile,
    selectSheet,
    setMapping,
    confirmMappingAndPrepare,
    updateCell,
    undo,
    redo,
    setStep,
    import: runImport
  } = useDataImporter({
    schema,
    onImport: async (rows) => {
      await fetch('/api/import', { method: 'POST', body: JSON.stringify(rows) });
    }
  });

  return (
    <div className="custom-wrapper">
      {state.currentStep === 'upload' && (
        <input type="file" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
      )}

      {state.currentStep === 'review' && (
        <div>
          <h3>Review Data ({state.statistics.valid} valid records)</h3>
          <button onClick={() => undo()} disabled={!state.canUndo}>Undo</button>
          <button onClick={() => redo()} disabled={!state.canRedo}>Redo</button>
          <button onClick={() => runImport()}>Import Now</button>
        </div>
      )}
    </div>
  );
}
```

---

## Mode 3: Render Props via `children`

Render your custom UI directly inside `<DataImporter>`:

```tsx
<DataImporter schema={schema} onImport={handleImport}>
  {(api) => (
    <div>
      {/* 100% custom UI here */}
      <span>Step: {api.state.currentStep}</span>
      <button onClick={() => api.import()}>Import</button>
    </div>
  )}
</DataImporter>
```

---

## Mode 4: Context Provider (`DataImporterProvider` & `useDataImporterContext`)

Use the context provider for complex, deeply-nested component hierarchies:

```tsx
import { DataImporterProvider, useDataImporterContext } from 'data-importer/react';

function CustomSubmitBar() {
  const { state, import: runImport } = useDataImporterContext();
  return (
    <button disabled={state.isLoading} onClick={() => runImport()}>
      {state.isLoading ? 'Importing...' : `Submit ${state.rows.length} rows`}
    </button>
  );
}

export function App() {
  return (
    <DataImporterProvider schema={schema} onImport={handleImport}>
      <CustomHeader />
      <CustomGrid />
      <CustomSubmitBar />
    </DataImporterProvider>
  );
}
```
