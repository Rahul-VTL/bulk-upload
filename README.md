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
- **Flexible UI System**: Use the beautiful **Default UI out-of-the-box**, or replace specific components, or build a **100% custom UI** with full headless primitives.

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
| **Flexible Step Navigation** | Bidirectional flow: easily go **back to column mapping** from the review grid, click previous steps in the header stepper, or navigate back to change sheets/files. |
| **Transformation Pipeline** | Built-in rules (`trim`, `uppercase`, `lowercase`, `capitalize`, `removeWhitespace`, `stringToNumber`, `stringToBoolean`, `stringToDate`, `normalizeDate`) and custom transformers. |
| **Comprehensive Validation** | Required, Email, Phone, Number, Integer, Date, Min/Max bounds, Regex, Enum, Custom Sync/Async, and Cross-Field validation. |
| **Duplicate Detection** | Single-field, composite-key deduplication (`keep-first`, `keep-last`, `reject`, `allow-warning`) and external database checks (`checkDuplicate`). |
| **Virtualized Spreadsheet** | 60fps windowed grid rendering handling tens of thousands of rows, keyboard navigation (Enter/Tab/Arrows/Escape), inline editing, and cell selection. |
| **Search, Sort & Filter** | Global text search, multi-column stable sorting, and nested AND/OR filter builder supporting all 12 operators. |
| **History & Bulk Ops** | Memory-efficient patch-based Undo/Redo stack, bulk editing of selected rows, bulk row deletion, and row addition. |
| **Error Export** | Immediate export of invalid rows and error diagnostics to CSV or XLSX format. |
| **Theme System & Headless** | Native CSS custom properties (`--di-*`), component slot overrides, render props, context provider, and complete headless hook. |

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

### 1. Default UI (Out of the box)

Zero configuration required. Provides complete file upload dropzone, sheet picker, fuzzy column mapping, virtual spreadsheet editor, error highlighting, and progress tracking:

```tsx
import React from 'react';
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

export function ImportModal() {
  const handleImport = async (rows, onProgress) => {
    const response = await fetch('/api/customers/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: rows })
    });

    if (!response.ok) {
      throw new Error('Failed to import records');
    }

    return await response.json();
  };

  return (
    <DataImporter
      schema={schema}
      acceptedFiles={['csv', 'xlsx', 'tsv']}
      onImport={handleImport}
      onComplete={(result) => {
        console.log(`Successfully imported ${result.importedRows} rows!`);
      }}
    />
  );
}
```

---

## 🎨 UI Customization: Default UI vs 100% Custom UI

Data Importer is designed with an API-first approach that accommodates any UI requirements:

### 1. Headless React Hook (`useDataImporter`) — *100% Custom UI*
If you want to build custom screens using your own design system (Tailwind CSS, MUI, Shadcn UI, AntD, Chakra):

```tsx
import { useDataImporter } from 'data-importer/react';

function CustomImporter() {
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
          <button onClick={() => setStep('mapping')}>← Back to Mapping</button>
          <button onClick={() => runImport()}>Submit Records</button>
        </div>
      )}
    </div>
  );
}
```

### 2. Render Props via `children`
Render a custom UI inline while retaining container styles:

```tsx
<DataImporter schema={schema} onImport={handleImport}>
  {({ state, loadFile, setStep, import: runImport }) => (
    <div>
      <h3>Current Step: {state.currentStep}</h3>
      {state.currentStep === 'review' && (
        <div>
          <button onClick={() => setStep('mapping')}>← Back to Mapping</button>
          <button onClick={() => runImport()}>Finish Import</button>
        </div>
      )}
    </div>
  )}
</DataImporter>
```

### 3. Step Render Props (`renderUpload`, `renderReview`, `renderFooter`, etc.)
Customize specific steps while keeping other steps on the default UI:

```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  renderUpload={({ loadFile }) => (
    <MyCustomDropzone onDrop={(file) => loadFile(file)} />
  )}
  renderFooter={({ state, setStep, import: runImport }) => (
    <div className="flex justify-between p-4 bg-white border-t">
      <button onClick={() => setStep('mapping')}>← Back to Column Mapping</button>
      <button onClick={() => runImport()} className="btn-primary">
        Import {state.rows.length} Records
      </button>
    </div>
  )}
/>
```

### 4. Context Provider (`DataImporterProvider` & `useDataImporterContext`)
For deeply nested compound component trees without prop drilling:

```tsx
import { DataImporterProvider, useDataImporterContext } from 'data-importer/react';

function CustomSubmitBar() {
  const { state, setStep, import: runImport } = useDataImporterContext();
  return (
    <div>
      <button onClick={() => setStep('mapping')}>← Back</button>
      <button onClick={() => runImport()} disabled={state.isLoading}>
        {state.isLoading ? 'Importing...' : 'Submit Records'}
      </button>
    </div>
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

### 5. Component Slot Overrides
Swap default subcomponents with your own React implementations:

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

## 🔄 Bidirectional Navigation & High-Column Handling

- **High Column Scalability**: When loading files with dozens or hundreds of columns, the Column Mapping view features an internal vertical scroll container with sticky headers (`th`), ensuring column headers remain visible while preserving the bottom action bar.
- **Review to Mapping Back Navigation**: Easily return from the Review spreadsheet to Column Mapping at any point via the `← Back to Column Mapping` footer button or by clicking "Map Columns" in the stepper header.
- **Mapping to Upload/Sheet Back Navigation**: Change selected sheets or pick another file using the `← Back` button in the Column Mapping footer.

---

## 📚 Documentation Index

Detailed documentation with complete code recipes is available in [`docs/`](./docs/):

- [Architecture & Boundaries](./docs/architecture.md)
- [Schema Specification](./docs/schema.md)
- [File Parsers (CSV, TSV, XLSX)](./docs/parsing.md)
- [Column Mapping Engine](./docs/mapping.md)
- [Transformation Engine](./docs/transformation.md)
- [Validation Engine & Custom Validators](./docs/validation.md)
- [Duplicate Detection](./docs/duplicates.md)
- [Editable Spreadsheet Grid](./docs/grid.md)
- [Filtering & Sorting Engine](./docs/filtering.md)
- [Importing Engine & Progress](./docs/importing.md)
- [Error Handling & Export](./docs/error-handling.md)
- [Theming & Design Tokens](./docs/theming.md)
- [Component Overrides & Custom UI](./docs/customization.md)
- [Typed Event System](./docs/events.md)
- [Core API Reference](./docs/core-api.md)
- [React Adapter & Hook](./docs/react.md)
- [Web Component Integration](./docs/web-component.md)
- [Performance & Virtualization](./docs/performance.md)
- [Automated Testing](./docs/testing.md)

---

## 🧪 Running the Playground & Tests

```bash
# Clone the repository
cd data-importer

# Install dependencies
pnpm install

# Run automated Vitest test suite
pnpm test

# Run interactive demo playground (Custom UI + Default UI live studio)
pnpm dev
```

---

## 📄 License

MIT
