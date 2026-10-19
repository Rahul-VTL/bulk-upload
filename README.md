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
| **High-Volume Dual Upload** | Upload 10,000 candidate records in CSV alongside 20,000 user photos and signatures in a companion ZIP archive. |
| **🔒 Dual Upload Gate** | When `enableZipUpload: true`, column mapping is strictly locked until **both** data spreadsheet and companion ZIP are uploaded and verified. |
| **⚡ Zero-Memory ZIP Reader** | Inspects End of Central Directory (EOCD) table of contents in **<15ms**, indexing 20,000 files without browser memory bloat or tab crashes. |
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

## 📦 Installation & Setup

Install the package via npm, pnpm, or yarn, and import the stylesheet in your root application file (`main.tsx`, `index.tsx`, or `App.tsx`):

```bash
# NPM
npm install data-importer

# PNPM
pnpm add data-importer

# Yarn
yarn add data-importer
```

```tsx
// In main.tsx, index.tsx, or App.tsx
import 'data-importer/styles.css';
```

---

## ⚡ Direct Next.js Integration (App Router & Pages Router)

`data-importer` ships with pre-compiled ESM bundles (`dist/index.js`, `dist/react.js`), types (`dist/*.d.ts`), and CSS (`dist/react.css`). It works seamlessly out-of-the-box in Next.js 13, 14, and 15.

### 1. Installation in Next.js Project
```bash
# Option A: From Local Directory Path (Development)
pnpm add file:/path-to/bulk-upload/packages/data-importer
# or
npm install /path-to/bulk-upload/packages/data-importer

# Option B: Directly from GitHub
pnpm add "git+https://github.com/Rahul-VTL/bulk-upload.git#path:packages/data-importer"

# Option C: From Tarball (.tgz)
pnpm add /path-to/data-importer-1.0.0.tgz
```

### 2. Import Global Styles
Add the stylesheet once in your root layout:

- **Next.js App Router**: In `app/layout.tsx`:
  ```tsx
  import 'data-importer/styles.css';
  ```
- **Next.js Pages Router**: In `pages/_app.tsx`:
  ```tsx
  import 'data-importer/styles.css';
  ```

### 3. Frontend Component (`'use client'`)
Because Next.js App Router defaults to Server Components, ensure your importer component specifies `'use client'` at the top:

```tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ImporterSchema } from 'data-importer';

// Best practice: dynamic import prevents SSR hydration mismatches
const DataImporterModal = dynamic(
  () => import('data-importer/react').then((mod) => mod.DataImporterModal),
  { ssr: false }
);

const candidateSchema: ImporterSchema = [
  { key: 'regNo', label: 'Registration No', type: 'string', required: true, unique: true },
  { key: 'name', label: 'Candidate Name', type: 'string', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'photo', label: 'Photo Filename', type: 'string', required: true },
  { key: 'signature', label: 'Signature Filename', type: 'string', required: true }
];

export default function CandidateImportPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = async (rows: any[], onProgress: any, meta: any) => {
    const formData = new FormData();
    formData.append('candidates', JSON.stringify(rows));
    if (meta?.file) formData.append('csvFile', meta.file);
    if (meta?.zipFile) formData.append('zipFile', meta.zipFile);

    const res = await fetch('/api/candidates/bulk-upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Import failed');
    }

    return await res.json();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Candidate Management</h1>
      <button onClick={() => setIsOpen(true)}>
        📥 Bulk Import Candidates (CSV + ZIP)
      </button>

      {isOpen && (
        <DataImporterModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Upload Candidates & Photos"
          schema={candidateSchema}
          enableZipUpload={true}
          zipUploadLabel="Upload ZIP containing candidate photos and signatures"
          zipAssetColumns={['photo', 'signature']}
          onImport={handleImport}
          onComplete={(result) => {
            alert(`Success! Imported ${result.importedRows} records.`);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
```

### 4. Next.js App Router API Route (`app/api/candidates/bulk-upload/route.ts`)
Handling the multipart upload containing both JSON candidate rows and the ZIP archive:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // 1. Cleaned candidate rows (JSON)
    const rawData = formData.get('candidates') as string;
    const candidates = JSON.parse(rawData || '[]');

    // 2. Uploaded ZIP archive (File / Blob)
    const zipFile = formData.get('zipFile') as File | null;
    const csvFile = formData.get('csvFile') as File | null;

    console.log(`Received ${candidates.length} candidates. ZIP archive: ${zipFile?.name} (${zipFile?.size} bytes)`);

    // TODO: Stream zipFile to S3 or disk and insert candidates into DB
    // await db.candidates.createMany({ data: candidates });

    return NextResponse.json({
      totalRows: candidates.length,
      importedRows: candidates.length,
      failedRows: 0,
      duration: 1150
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
```

---

## 📦 High-Volume Dual Upload: 10,000 Users (CSV) + 20,000 Images (ZIP)

When onboarding users, candidates, students, or employees with companion image assets (e.g., photo IDs and signatures), activate **Dual Upload Mode**:

```tsx
import React from 'react';
import { DataImporter, ImporterSchema } from 'data-importer/react';
import 'data-importer/styles.css';

const candidateSchema: ImporterSchema = [
  { key: 'registrationNo', label: 'Registration No', type: 'string', required: true, unique: true },
  { key: 'fullName', label: 'Candidate Name', type: 'string', required: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'phone', required: true },
  { 
    key: 'photo', 
    label: 'Photo Filename', 
    type: 'string', 
    required: true,
    description: 'Filename inside the companion ZIP archive (e.g. CAND_001_photo.jpg)'
  },
  { 
    key: 'signature', 
    label: 'Signature Filename', 
    type: 'string', 
    required: true,
    description: 'Filename inside the companion ZIP archive (e.g. CAND_001_sign.png)'
  }
];

export const CandidateBulkImporter = () => {
  return (
    <DataImporter
      schema={candidateSchema}
      // 🔑 Activates Dual Upload Mode (Requires both CSV and ZIP before mapping)
      enableZipUpload={true}
      zipUploadLabel="Upload ZIP containing all 20,000 candidate photos and signatures"
      // 🔑 Automatically validates that filenames in the CSV actually exist in the ZIP
      zipAssetColumns={['photo', 'signature']}
      onImport={async (rows, onProgress, meta) => {
        // rows: Cleaned, validated, and mapped 10,000 JSON records
        // meta.file: Original CSV File object
        // meta.zipFile: Original ZIP File object containing 20,000 image assets
        await handleBackendUpload(rows, onProgress, meta);
      }}
    />
  );
};
```

### 🔒 Dual Upload Gate Rules
- When `enableZipUpload: true`, **mapping is locked** until **BOTH** the CSV data spreadsheet and companion ZIP archive are uploaded.
- The UI displays live status badges for both files. If only one file is uploaded, the **"Proceed to Field Mapping →"** button remains disabled with a helper alert.
- **Zero-Memory ZIP Inspector**: The browser never unzips or buffers 20,000 files in memory. Instead, it inspects only the End of Central Directory (EOCD) binary footer in **<15ms**, indexing filenames with zero risk of browser OOM or tab crashes.

---

## 🚀 Real-Time Backend Integration Patterns

Here are the 3 production-grade patterns to send both CSV records and companion ZIP files to your backend:

### Pattern 1: Standard Multipart `FormData` (Direct API Upload)

Sends cleaned rows as JSON alongside both the original CSV and ZIP archive in a single HTTP request with live percentage progress:

#### Frontend Implementation (React)
```typescript
import axios from 'axios';

const handleImportWithFormData = async (rows, onProgress, meta) => {
  const formData = new FormData();

  // 1. Cleaned and validated JSON records (10,000 candidates)
  formData.append('data', JSON.stringify(rows));

  // 2. Original CSV/Excel spreadsheet
  if (meta?.file) {
    formData.append('csvFile', meta.file);
  }

  // 3. Companion ZIP archive containing 20,000 photos & signatures
  if (meta?.zipFile) {
    formData.append('zipFile', meta.zipFile);
  }

  // 4. Send with live upload progress tracking
  const response = await axios.post('/api/v1/candidates/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({
          percentage: percent,
          processed: progressEvent.loaded,
          total: progressEvent.total,
          successCount: Math.round((percent / 100) * rows.length),
          failureCount: 0
        });
      }
    }
  });

  return response.data;
};
```

#### Backend Implementation (Node.js / Express + Multer)
```javascript
import express from 'express';
import multer from 'multer';
import unzipper from 'unzipper';
import fs from 'fs';

const upload = multer({ dest: '/tmp/uploads/' });
const router = express.Router();

router.post(
  '/api/v1/candidates/bulk-upload',
  upload.fields([{ name: 'zipFile', maxCount: 1 }, { name: 'csvFile', maxCount: 1 }]),
  async (req, res) => {
    try {
      const candidates = JSON.parse(req.body.data); // 10,000 cleaned records
      const zipFile = req.files['zipFile']?.[0];    // 20,000 image ZIP archive

      console.log(`Received ${candidates.length} records and ZIP: ${zipFile?.originalname}`);

      // Extract ZIP stream to destination directory or cloud storage
      if (zipFile) {
        fs.createReadStream(zipFile.path)
          .pipe(unzipper.Extract({ path: `/data/assets/${req.body.batchId || 'batch-1'}` }));
      }

      // Batch insert candidate metadata records into Database
      await db.candidates.bulkCreate(candidates);

      return res.status(200).json({
        totalRows: candidates.length,
        importedRows: candidates.length,
        failedRows: 0,
        duration: 1200
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
```

---

### Pattern 2: Cloud Storage / S3 Presigned URL (Enterprise Recommended 🚀)

For datasets with 10k–50k records and 100MB–500MB ZIP files, uploading directly from the browser to Amazon S3 / Google Cloud Storage avoids web server memory exhaustion, reverse-proxy payload limits, and request timeouts:

```
[Browser] ──── 1. POST /presigned-url ────> [Backend API]
[Browser] <─── 2. S3 Presigned URL ──────── [Backend API]
[Browser] ──── 3. PUT (ZIP File) ─────────> [Amazon S3 Bucket]
[Browser] ──── 4. POST (JSON + S3 Key) ───> [Backend Worker Queue (BullMQ/Celery)]
```

#### Frontend Implementation (React)
```typescript
import axios from 'axios';

const handleImportWithPresignedUrl = async (rows, onProgress, meta) => {
  // Step 1: Request S3 Presigned URL from backend
  const { data: presignedData } = await axios.post('/api/v1/uploads/presigned-url', {
    zipFileName: meta?.zipFile?.name,
    zipContentType: meta?.zipFile?.type || 'application/zip',
    totalCandidates: rows.length
  });

  const { zipUploadUrl, zipS3Key, batchId } = presignedData;

  // Step 2: Directly stream ZIP file to Amazon S3 with progress tracking
  if (meta?.zipFile) {
    await axios.put(zipUploadUrl, meta.zipFile, {
      headers: { 'Content-Type': meta.zipFile.type || 'application/zip' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            percentage: percent,
            processed: progressEvent.loaded,
            total: progressEvent.total
          });
        }
      }
    });
  }

  // Step 3: Trigger backend background worker queue with candidate metadata & S3 key
  await axios.post('/api/v1/candidates/process-batch', {
    batchId,
    zipS3Key,
    candidates: rows
  });

  return {
    totalRows: rows.length,
    importedRows: rows.length,
    failedRows: 0,
    duration: 1500
  };
};
```

#### Backend Implementation (Python / FastAPI + AWS Boto3)
```python
from fastapi import FastAPI, BackgroundTasks
import boto3
import uuid

app = FastAPI()
s3_client = boto3.client('s3', region_name='ap-south-1')
BUCKET_NAME = 'my-candidate-assets-bucket'

@app.post('/api/v1/uploads/presigned-url')
def generate_presigned_url(payload: dict):
    batch_id = str(uuid.uuid4())
    s3_key = f"uploads/{batch_id}/{payload['zipFileName']}"
    
    # Generate S3 presigned PUT URL valid for 30 minutes
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': BUCKET_NAME, 'Key': s3_key, 'ContentType': payload['zipContentType']},
        ExpiresIn=1800
    )
    return {'zipUploadUrl': presigned_url, 'zipS3Key': s3_key, 'batchId': batch_id}

@app.post('/api/v1/candidates/process-batch')
def process_batch(payload: dict, background_tasks: BackgroundTasks):
    # Enqueue background task to extract ZIP from S3 and insert candidates into DB
    background_tasks.add_task(extract_zip_and_save_candidates, payload['zipS3Key'], payload['candidates'])
    return {'status': 'processing', 'batchId': payload['batchId']}
```

---

### Pattern 3: Chunked Streaming Uploads (`chunkSize={100}`)

For streaming large datasets in micro-batches with automatic retries on failure:

```tsx
import { DataImporter, uploadInChunks } from 'data-importer/react';

// Option A: Declarative chunking via DataImporter
<DataImporter
  schema={candidateSchema}
  chunkSize={100} // Sends 100 records per HTTP request
  enableZipUpload={true}
  onUploadChunk={async (chunkRows, meta) => {
    // meta.chunkIndex: Current chunk index (0, 1, 2...)
    // meta.totalChunks: Total number of chunk batches
    // meta.zipFile: Companion ZIP File attached to chunk
    return await api.postChunk({
      chunkIndex: meta.chunkIndex,
      totalChunks: meta.totalChunks,
      records: chunkRows
    });
  }}
/>

// Option B: Standalone uploadInChunks helper function
const result = await uploadInChunks(
  cleanedRows,
  async (chunk, meta) => {
    return await api.post('/api/candidates/chunk', {
      chunkIndex: meta.chunkIndex,
      items: chunk
    });
  },
  {
    chunkSize: 100,
    retries: 3, // Auto-retry up to 3 times on network failure
    onProgress: (p) => {
      console.log(`Ingested ${p.processed} of ${p.total} (${p.percentage}%)`);
    }
  }
);
```

---

## 📋 Backend Payload & Response Contract (OpenAPI Specification)

The `onImport` handler expects the backend response to adhere to this contract:

```typescript
interface ImportResult {
  totalRows: number;      // Total number of rows evaluated
  importedRows: number;   // Number of rows successfully written to database
  failedRows: number;     // Number of rows that failed server-side insertion
  duration?: number;      // Execution duration in milliseconds
  
  // Optional: Detailed row-level error reporting for precise UI highlighting
  rowResults?: Array<{
    rowId: string;        // ID matching the row from rows[i]._id or index
    success: boolean;     // Whether this specific record succeeded
    error?: string;       // Human-readable error message
  }>;
}
```

#### Example Success Response:
```json
{
  "totalRows": 10000,
  "importedRows": 10000,
  "failedRows": 0,
  "duration": 1840
}
```

#### Example Partial Success Response (Invalid Records Downloadable):
```json
{
  "totalRows": 10000,
  "importedRows": 9998,
  "failedRows": 2,
  "rowResults": [
    { "rowId": "row-412", "success": false, "error": "Email already exists in database" },
    { "rowId": "row-899", "success": false, "error": "Signature file is corrupted" }
  ]
}
```

---

## 🪟 Drop-in Modal Dialog (`DataImporterModal`)

Open the importer inside an accessible modal dialog popup with backdrop blur and responsive sizing:

```tsx
import React, { useState } from 'react';
import { DataImporterModal, ImporterSchema } from 'data-importer/react';
import 'data-importer/styles.css';

const schema: ImporterSchema = [
  { key: 'name', label: 'Full Name', type: 'string', required: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true, unique: true },
  { key: 'role', label: 'Role', type: 'enum', options: [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ]}
];

export const UserImportModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Upload / Import Data
      </button>

      <DataImporterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Import Customer Records"
        schema={schema}
        onImport={async (rows, onProgress) => {
          const response = await fetch('/api/import-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows })
          });
          return await response.json();
        }}
        onComplete={(result) => {
          console.log('Import finished:', result);
          setIsOpen(false);
        }}
      />
    </div>
  );
};
```

---

## 🎨 Headless Custom UI (`useDataImporter`)

For 100% custom UI control (Tailwind, Shadcn, MUI, AntD), use the headless hook:

```tsx
import React from 'react';
import { useDataImporter, ImporterSchema } from 'data-importer/react';

export const CustomImporterWizard = ({ schema }: { schema: ImporterSchema }) => {
  const {
    state,
    loadFile,
    loadZipFile,
    removeZipFile,
    proceedToMapping,
    setMapping,
    autoMap,
    updateCell,
    undo,
    redo,
    deleteRows,
    exportErrors,
    import: runImport,
    importValidOnly,
    downloadInvalidRows,
    reset
  } = useDataImporter({
    schema,
    enableZipUpload: true,
    onImport: async (rows, onProgress, meta) => {
      return await api.bulkSubmit(rows, meta?.zipFile);
    }
  });

  const { currentStep, file, zipFile, rows, statistics } = state;

  return (
    <div>
      {/* Upload Step */}
      {currentStep === 'upload' && (
        <div>
          {/* CSV File Input */}
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />

          {/* ZIP Archive Input */}
          <input
            type="file"
            accept=".zip"
            onChange={(e) => e.target.files?.[0] && loadZipFile(e.target.files[0])}
          />

          {/* Gated Proceed Button: Only enabled when both CSV and ZIP are loaded */}
          <button
            disabled={!file || !zipFile}
            onClick={() => proceedToMapping()}
          >
            Proceed to Column Mapping →
          </button>
        </div>
      )}

      {/* Mapping Step */}
      {currentStep === 'mapping' && (
        <div>
          <button onClick={autoMap}>Auto-Map Columns</button>
        </div>
      )}

      {/* Review Step */}
      {currentStep === 'review' && (
        <div>
          <h3>Reviewing {rows.length} records ({statistics.invalid} errors)</h3>

          {/* Import Only Valid Rows */}
          {statistics.invalid > 0 && statistics.valid > 0 && (
            <button onClick={() => importValidOnly()}>
              Upload Valid Only ({statistics.valid})
            </button>
          )}

          {/* Import All */}
          <button onClick={() => runImport()} disabled={statistics.invalid > 0}>
            Upload All
          </button>
        </div>
      )}

      {/* Result Step */}
      {currentStep === 'result' && (
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
};
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

## 📄 License

MIT
