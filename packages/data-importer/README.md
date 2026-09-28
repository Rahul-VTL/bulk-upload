# Data Importer

> A modern, production-grade, reusable, framework-agnostic Data Importer, Data Preparation & Editable Spreadsheet Library.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Production-Ready-green.svg)]()

---

## 🎯 What is Data Importer?

**Data Importer** is a developer product that solves bulk file import and data preparation for any modern web application. Whether you are building an ERP, CRM, HR system, admin portal, SaaS, education platform, or financial app, Data Importer eliminates the need to build file uploaders, CSV/XLSX parsers, column mappers, spreadsheet editors, and validation engines from scratch.

### 💡 Core Philosophy
- **Completely Generic**: Knows **nothing** about backend APIs, databases, authentication, or domain models.
- **Consumer Controlled**: The host application owns APIs, authentication, permissions, database schemas, and business submission.
- **Layered Architecture**: Zero-dependency core headless engine (`data-importer`) paired with a React adapter (`data-importer/react`) and Web Component wrapper (`<generic-data-importer>`).
- **Flexible UI System**: Use the enterprise-grade **Default UI out-of-the-box**, customize via slot overrides & render props, or build a **100% custom UI** with headless primitives.

```
FILE → PARSE → MAP → TRANSFORM → VALIDATE → EDIT → REVIEW → IMPORT
```

---

## 🚀 Key Features

| Capability | Highlights |
|---|---|
| **Multi-Format Parsing** | RFC-4180 CSV, TSV, XLS, XLSX. State-machine handling for quotes, newlines, escaped quotes, BOM stripping, delimiter autodetection. |
| **Multi-Sheet Workbooks** | Interactive worksheet detection, row/column counts, and sheet selection. |
| **Intelligent Mapping** | 6 matching strategies: Exact, Case-Insensitive, Trimmed, Normalized, Alias, and Fuzzy matching with 0-1 confidence scoring. |
| **High-Column Scalability** | Smooth vertical and horizontal scrolling with **sticky column headers** in mapping and review when files contain dozens or hundreds of columns. |
| **Bidirectional Navigation** | Effortlessly return to **Column Mapping** from the review spreadsheet, jump back via interactive header stepper clicks, or go back to change sheets. |
| **Transformation Pipeline** | Built-in rules (`trim`, `uppercase`, `lowercase`, `capitalize`, `removeWhitespace`, `stringToNumber`, `stringToBoolean`, `stringToDate`, `normalizeDate`) and custom transformers. |
| **Comprehensive Validation** | Required, Email, Phone, Number, Integer, Date, Min/Max bounds, Regex, Enum, Custom Sync/Async, and Cross-Field validation. |
| **Duplicate Detection** | Single-field, composite-key deduplication (`keep-first`, `keep-last`, `reject`, `allow-warning`) and external database checks (`checkDuplicate`). |
| **Virtualized Spreadsheet** | 60fps windowed grid rendering handling tens of thousands of rows, keyboard navigation (Enter/Tab/Arrows/Escape), inline editing, and cell selection. |
| **Search, Sort & Filter** | Global text search, multi-column stable sorting, and nested AND/OR filter builder supporting all 12 operators. |
| **History & Bulk Ops** | Memory-efficient patch-based Undo/Redo stack, bulk editing of selected rows, bulk row deletion, and row addition. |
| **Error Export** | Immediate export of invalid rows and error diagnostics to CSV or XLSX format. |
| **Theme System & Headless** | Native CSS custom properties (`--di-*`), component slot overrides, step render props, context provider, and complete headless hook. |

---

## 📦 Installation

```bash
# Core headless engine + React adapter
npm install data-importer
# or
pnpm add data-importer
# or
yarn add data-importer
```

---

## ⚡ Quick Start

### 1. React Application (Default Turnkey UI)

```tsx
import React, { useState } from 'react';
import { DataImporter, builtInValidators, builtInTransformers } from 'data-importer/react';
import 'data-importer/styles.css';

const schema = [
  {
    key: 'name',
    label: 'Customer Name',
    type: 'string',
    required: true,
    aliases: ['client_name', 'account'],
    transformers: [builtInTransformers.trim()]
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    unique: true,
    aliases: ['e-mail', 'mail'],
    validators: [builtInValidators.email()]
  },
  {
    key: 'plan',
    label: 'Plan Tier',
    type: 'enum',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Enterprise', value: 'enterprise' }
    ]
  }
];

export function UserImportPopup() {
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = async (rows) => {
    // Submit prepared rows to your existing API
    const response = await fetch('/api/customers/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: rows })
    });
    return await response.json();
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Import Data</button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90vw', height: '85vh', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <DataImporter
              schema={schema}
              theme={{ primary: '#2563eb' }}
              onImport={handleImport}
              onComplete={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2. Framework-Agnostic Headless Core (Vanilla JS / Vue / Angular / Node)

```ts
import { createImporter } from 'data-importer';

const importer = createImporter({
  schema: [
    { key: 'sku', label: 'SKU', type: 'string', required: true },
    { key: 'price', label: 'Price', type: 'number', required: true }
  ],
  onImport: async (rows) => {
    return await myBackendService.import(rows);
  }
});

// Load and process a file
await importer.loadFile(uploadedFile);

// Confirm mapping, apply transformers & validators
await importer.confirmMappingAndPrepare();

// Edit cells or query validation
importer.updateCell('row_1', 'price', 29.99);

// Execute submission
const result = await importer.import();
console.log(result);
```

---

## 🎨 UI Options: Default UI vs Custom UI

Data Importer is designed with maximum flexibility: you can use the **Default UI out-of-the-box**, or replace parts of it, or build a **100% custom UI** with complete control over design, CSS, and layout.

### Option 1: Default UI (Out of the box)
Zero configuration needed. It gives you an enterprise spreadsheet, wizard stepper, mapping panel, and validation review:

```tsx
import { DataImporter } from 'data-importer/react';
import 'data-importer/styles.css';

<DataImporter
  schema={schema}
  onImport={handleImport}
/>
```

---

### Option 2: 100% Custom UI via Headless Hook (`useDataImporter`)
If you want to design your own custom screens (using Tailwind, MUI, Shadcn UI, AntD, etc.), use the headless React hook. You get full control over the DOM, while the hook manages all state, parsing, mapping, validation, duplicate detection, and undo/redo:

```tsx
import { useDataImporter } from 'data-importer/react';

function MyCustomImporter() {
  const {
    state,
    loadFile,
    setMapping,
    confirmMappingAndPrepare,
    updateCell,
    undo,
    redo,
    setStep,
    import: runImport,
    reset
  } = useDataImporter({
    schema,
    onImport: handleImport
  });

  return (
    <div className="my-custom-container">
      {state.currentStep === 'upload' && (
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
      )}

      {state.currentStep === 'review' && (
        <div>
          <h2>Review Data ({state.rows.length} rows)</h2>
          <table>
            {state.rows.map((row, idx) => (
              <tr key={state.rowIds[idx]}>
                <td>{String(row.name)}</td>
                <td>{String(row.email)}</td>
              </tr>
            ))}
          </table>
          <button onClick={() => setStep('mapping')}>← Back to Mapping</button>
          <button onClick={() => runImport()}>Submit Records</button>
        </div>
      )}
    </div>
  );
}
```

---

### Option 3: Custom UI via Render Prop (`children` as a function)
Pass a function as `children` to `<DataImporter>`:

```tsx
import { DataImporter } from 'data-importer/react';

<DataImporter schema={schema} onImport={handleImport}>
  {({ state, loadFile, setStep, import: runImport }) => (
    <div>
      {/* Build your own custom UI right here */}
      {state.currentStep === 'review' && (
        <button onClick={() => setStep('mapping')}>← Back to Mapping</button>
      )}
      <button onClick={() => runImport()}>Import Now</button>
    </div>
  )}
</DataImporter>
```

---

### Option 4: Custom UI via Context (`DataImporterProvider` & `useDataImporterContext`)
For deeply nested custom components without prop drilling:

```tsx
import { DataImporterProvider, useDataImporterContext } from 'data-importer/react';

function CustomSubmitButton() {
  const { state, setStep, import: runImport } = useDataImporterContext();
  return (
    <div>
      <button onClick={() => setStep('mapping')}>← Back</button>
      <button disabled={state.isLoading} onClick={() => runImport()}>
        {state.isLoading ? 'Importing...' : 'Save All Records'}
      </button>
    </div>
  );
}

export function App() {
  return (
    <DataImporterProvider schema={schema} onImport={handleImport}>
      <MyCustomHeader />
      <MyCustomBody />
      <CustomSubmitButton />
    </DataImporterProvider>
  );
}
```

---

### Option 5: Step Render Props (`renderUpload`, `renderReview`, etc.)
Keep the default UI for all steps except the ones you want to customize:

```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  renderUpload={({ loadFile, state }) => (
    <div className="my-fancy-drag-and-drop">
      <input type="file" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
    </div>
  )}
  renderFooter={({ state, setStep, import: runImport }) => (
    <div className="my-custom-footer">
      <span>Rows to upload: {state.rows.length}</span>
      <button onClick={() => setStep('mapping')}>← Back to Mapping</button>
      <button onClick={() => runImport()}>Confirm & Finish</button>
    </div>
  )}
/>
```

---

### Option 6: Component Slot Overrides (`components={{ ... }}`)
Replace individual subcomponents with your own React components:

```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  components={{
    Header: MyCustomHeader,
    UploadZone: MyCustomUploadZone,
    SheetSelector: MyCustomSheetSelector,
    MappingPanel: MyCustomMappingPanel,
    Grid: MyCustomGrid,
    Footer: MyCustomFooter
  }}
/>
```

---

## 🔄 Bidirectional Step Navigation & High-Column Handling

- **Vertical Scrolling & Sticky Headers**: When a spreadsheet with 20, 50, or 100+ columns is loaded, the Column Mapping view features internal vertical scrolling with sticky column headers (`th`). The header remains visible at all times, and the bottom action bar stays fixed in place.
- **Back to Column Mapping from Review**: Reviewing rows and noticed a mapping mistake? Click `← Back to Column Mapping` in the footer or click "Map Columns" in the stepper header to instantly return and adjust your mappings.
- **Back from Mapping to File Selection**: Return to workbook sheet selection or file upload at any time using the `← Back` button in the Column Mapping footer.

---

## 📄 License

MIT
