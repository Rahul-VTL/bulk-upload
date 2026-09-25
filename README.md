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
- **Original UI/UX**: Professional enterprise spreadsheet interface with original styling, design tokens, and no commercial clones.

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
| **Transformation Pipeline** | Built-in rules (`trim`, `uppercase`, `lowercase`, `capitalize`, `removeWhitespace`, `stringToNumber`, `stringToBoolean`, `stringToDate`, `normalizeDate`) and custom transformers. |
| **Comprehensive Validation** | Required, Email, Phone, Number, Integer, Date, Min/Max bounds, Regex, Enum, Custom Sync/Async, and Cross-Field validation. |
| **Duplicate Detection** | Single-field, composite-key deduplication (`keep-first`, `keep-last`, `reject`, `allow-warning`) and external database checks (`checkDuplicate`). |
| **Virtualized Spreadsheet** | 60fps windowed grid rendering handling tens of thousands of rows, keyboard navigation (Enter/Tab/Arrows/Escape), inline editing, and cell selection. |
| **Search, Sort & Filter** | Global text search, multi-column stable sorting, and nested AND/OR filter builder supporting all 12 operators. |
| **History & Bulk Ops** | Memory-efficient patch-based Undo/Redo stack, bulk editing of selected rows, bulk row deletion, and row addition. |
| **Error Export** | Immediate export of invalid rows and error diagnostics to CSV or XLSX format. |
| **Theme System** | Native CSS custom properties (`--di-*`) allowing custom color schemes and complete component overrides. |

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

### 1. React Application

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
    // Submit prepared rows to your existing API
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

// Inspect generated mappings
console.log(importer.getState().mappings);

// Confirm mapping, apply transformers & validators
await importer.confirmMappingAndPrepare();

// Edit cells or query validation
importer.updateCell('row_1', 'price', 29.99);

// Execute submission
const result = await importer.import();
console.log(result);
```

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
- [Component Overrides](./docs/customization.md)
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

# Run interactive demo playground
pnpm dev
```

---

## 📄 License

MIT
