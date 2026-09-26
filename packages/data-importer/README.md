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

## 📄 License

MIT
