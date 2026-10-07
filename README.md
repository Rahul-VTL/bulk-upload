# Data Importer

> A modern, production-grade, reusable, framework-agnostic Data Importer, Data Preparation & Editable Spreadsheet Library.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Production-Ready-green.svg)]()

---

## 🎯 What is Data Importer?

**Data Importer** solves bulk file import and data preparation for any modern web application. Whether you are building an ERP, CRM, HR system, admin portal, SaaS, education platform, or financial app, Data Importer eliminates the need to build file uploaders, CSV/XLSX parsers, column mappers, spreadsheet editors, and validation engines from scratch.

### 💡 Core Philosophy
- **Completely Generic**: Knows **nothing** about backend APIs, databases, authentication, or domain models.
- **Consumer Controlled**: The host application owns APIs, authentication, permissions, database schemas, and business submission.
- **Layered Architecture**: Zero-dependency core headless engine (`data-importer`) paired with a React adapter (`data-importer/react`) and Web Component wrapper (`<generic-data-importer>`).
- **Flexible UI System**: Use the enterprise-grade **Default UI out-of-the-box**, customize via slot overrides & render props, or build a **100% custom UI** with headless primitives.

```
FILE → PARSE → MAP → TRANSFORM → VALIDATE → EDIT → REVIEW → IMPORT (ALL OR VALID ONLY) → RESULT & ERROR EXPORT
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
| **Upload Only Valid Records** | When files contain errors, users can upload **only valid rows** (`Import Valid Only ({count})`) without being blocked by invalid rows. |
| **Download Invalid Records** | After upload finishes, download all failed/invalid rows in CSV/XLSX with all original columns plus an **Error Reason** column for quick user correction. |
| **Back to Listing Navigation** | Post-upload result view displays a dedicated **Back to Listing** button (`onBackToListing`, `backToListingLabel`) to smoothly return to listing pages. |
| **Transformation Pipeline** | Built-in rules (`trim`, `uppercase`, `lowercase`, `capitalize`, `removeWhitespace`, `stringToNumber`, `stringToBoolean`, `stringToDate`, `normalizeDate`) and custom transformers. |
| **Comprehensive Validation** | Required, Email, Phone, Number, Integer, Date, Min/Max bounds, Regex, Enum, Custom Sync/Async, and Cross-Field validation. |
| **Duplicate Detection** | Single-field, composite-key deduplication (`keep-first`, `keep-last`, `reject`, `allow-warning`) and external database checks (`checkDuplicate`). |
| **Virtualized Spreadsheet** | 60fps windowed grid rendering handling tens of thousands of rows, keyboard navigation (Enter/Tab/Arrows/Escape), inline editing, and cell selection. |
| **Search, Sort & Filter** | Global text search, multi-column stable sorting, and nested AND/OR filter builder supporting all 12 operators. |
| **History & Bulk Ops** | Memory-efficient patch-based Undo/Redo stack, bulk editing of selected rows, bulk row deletion, and row addition. |
| **Theme System & Headless** | Native CSS custom properties (`--di-*`), component slot overrides, step render props, context provider, and complete headless hook. |

---

## 📦 How to Use in Any Project

You can use `data-importer` in any project using one of the following methods:

### Method 1: Install Directly from GitHub

```bash
# Using Git repository URL
npm install "git+https://github.com/Rahul-VTL/bulk-upload.git#path:packages/data-importer"
# or
pnpm add "git+https://github.com/Rahul-VTL/bulk-upload.git#path:packages/data-importer"
# or
yarn add "git+https://github.com/Rahul-VTL/bulk-upload.git#path:packages/data-importer"
```

### Method 2: Local Tarball (`npm pack`)
You can pack the package into a `.tgz` file and install it in any project without publishing to npm:

1. Inside `data-importer`:
   ```bash
   pnpm build
   npm pack
   # Output: data-importer-1.0.0.tgz
   ```

2. In your target project:
   ```bash
   npm install /path/to/data-importer-1.0.0.tgz
   # or
   pnpm add /path/to/data-importer-1.0.0.tgz
   ```

### Method 3: Local Directory Reference (`file:`)
In `package.json` of your target project:
```json
{
  "dependencies": {
    "data-importer": "file:../path-to/bulk-upload/packages/data-importer"
  }
}
```

### Method 4: Install from npm (Once Published)
```bash
npm install data-importer
# or
pnpm add data-importer
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
    key: 'phone',
    label: 'Phone Number',
    type: 'string',
    validators: [builtInValidators.phone()]
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

export function UserImportPopup({ onBackToListing }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleImport = async (rows) => {
    // rows contains only valid records if user chooses "Import Valid Only"
    const response = await fetch('/api/customers/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: rows })
    });
    return await response.json();
  };

  return (
    <DataImporter
      schema={schema}
      theme={{ primary: '#003366' }}
      onImport={handleImport}
      onBackToListing={onBackToListing}
      backToListingLabel="Back to Customers"
      onComplete={(result) => {
        console.log('Import finished:', result);
      }}
    />
  );
}
```

---

## 🌟 Upload Only Valid Rows & Error Download

### 1. Upload Valid Rows Only
When your uploaded dataset has errors:
- If `allowImportWithErrors: false` (default), users are not blocked! They can click **`Import Valid Only ({count} Records)`**.
- Only records that pass validation are submitted to `onImport` or `onUploadChunk`.
- The skipped invalid rows are automatically tracked and reported in the result summary.

### 2. Download Invalid Records with Error Reasons
When upload completes:
- If any invalid or duplicate rows existed, the result view displays:
  **`Download Invalid Records ({count})`**
- Clicking this generates a clean spreadsheet containing:
  - All original data columns from the invalid rows
  - An **`Error Reason`** column with clear human-readable error descriptions for each row
- Users can review the errors, fix values directly in the file, delete the error reason column, and re-upload!

### 3. Back to Listing Button
The result screen provides a **`Back to Listing`** button to return directly to the parent listing table:
```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  onBackToListing={() => navigate('/customers')}
  backToListingLabel="Back to Customers Listing"
/>
```

---

## 🎨 Headless Custom UI (`useDataImporter`)

For 100% custom UI control (Tailwind, Shadcn, MUI, AntD), use the headless hook:

```tsx
import { useDataImporter } from 'data-importer/react';

function CustomImporter() {
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
    importValidOnly,
    downloadInvalidRows,
    reset
  } = useDataImporter({
    schema,
    onImport: async (rows) => {
      return await myApi.submit(rows);
    }
  });

  return (
    <div>
      {/* Upload Step */}
      {state.currentStep === 'upload' && (
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
      )}

      {/* Review Step */}
      {state.currentStep === 'review' && (
        <div>
          <h3>Total: {state.rows.length} | Valid: {state.statistics.valid} | Errors: {state.statistics.invalid}</h3>

          {/* Import Only Valid Rows */}
          {state.statistics.invalid > 0 && state.statistics.valid > 0 && (
            <button onClick={() => importValidOnly()}>
              Upload Valid Only ({state.statistics.valid})
            </button>
          )}

          {/* Import All */}
          <button onClick={() => runImport()} disabled={state.statistics.invalid > 0}>
            Upload All
          </button>
        </div>
      )}

      {/* Result Step */}
      {state.currentStep === 'result' && (
        <div>
          <h3>Import Complete!</h3>
          <p>Imported: {state.result?.importedRows} | Failed: {state.result?.failedRows}</p>

          {/* Download Invalid Records Button */}
          {state.result?.failedRows > 0 && (
            <button onClick={() => downloadInvalidRows('csv')}>
              Download Invalid Records ({state.result.failedRows})
            </button>
          )}

          {/* Back to Listing Button */}
          <button onClick={() => window.location.href = '/listing'}>
            Back to Listing
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## ⚡ Chunked Upload for Large Files

Upload 10,000+ rows smoothly in chunks:

```tsx
<DataImporter
  schema={schema}
  chunkSize={100} // sends 100 rows per chunk
  onUploadChunk={async (chunk, meta) => {
    // meta: { chunkIndex, totalChunks, startIndex, endIndex, totalRows }
    await fetch('/api/import-chunk', {
      method: 'POST',
      body: JSON.stringify({ chunk, meta })
    });
  }}
  onBackToListing={() => navigate('/listing')}
/>
```

---

## 📄 License

MIT
