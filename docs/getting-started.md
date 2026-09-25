# Getting Started with Data Importer

This guide walks through integrating Data Importer into your web application in under 5 minutes.

## Installation

Install the package into your project:

```bash
pnpm add data-importer
# or
npm install data-importer
```

If you are using React, ensure you also import the stylesheet:

```tsx
import 'data-importer/styles.css';
```

## Basic Example (React)

```tsx
import React from 'react';
import { DataImporter, builtInValidators, builtInTransformers } from 'data-importer/react';
import 'data-importer/styles.css';

const schema = [
  {
    key: 'first_name',
    label: 'First Name',
    type: 'string',
    required: true,
    transformers: [builtInTransformers.trim(), builtInTransformers.capitalize()]
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    unique: true,
    aliases: ['mail', 'e-mail', 'contact'],
    validators: [builtInValidators.email()]
  },
  {
    key: 'age',
    label: 'Age',
    type: 'integer',
    validators: [builtInValidators.min(18), builtInValidators.max(120)]
  }
];

export function UserImportModal() {
  const handleImport = async (rows, onProgress) => {
    // Send clean records to your backend
    const res = await fetch('/api/users/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: rows })
    });
    return await res.json();
  };

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <DataImporter
        schema={schema}
        acceptedFiles={['csv', 'xlsx']}
        maxFileSize={20 * 1024 * 1024}
        onImport={handleImport}
        onComplete={(result) => {
          alert(`Successfully imported ${result.importedRows} users!`);
        }}
      />
    </div>
  );
}
```

## Basic Example (Headless Core / Vanilla JS)

```ts
import { createImporter } from 'data-importer';

const importer = createImporter({
  schema: [
    { key: 'code', label: 'Item Code', type: 'string', required: true },
    { key: 'quantity', label: 'Quantity', type: 'integer', required: true }
  ],
  onImport: async (rows) => {
    console.log('Sending clean rows to server:', rows);
  }
});

// Load user-selected file
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await importer.loadFile(file);
  await importer.confirmMappingAndPrepare();
  const result = await importer.import();
  console.log('Done:', result);
});
```
