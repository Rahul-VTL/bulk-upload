import React, { useState } from 'react';

type DocCategory = 'all' | 'zip-workflow' | 'backend-integration' | 'ui-components' | 'api-contract';

interface Snippet {
  id: string;
  category: 'zip-workflow' | 'backend-integration' | 'ui-components' | 'api-contract';
  title: string;
  badge: string;
  badgeColor?: string;
  description: string;
  code: string;
  language?: string;
}

export const DocsGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SNIPPETS: Snippet[] = [
    {
      id: 'quickstart-install',
      category: 'ui-components',
      title: '1. Package Installation & CSS Import',
      badge: 'Getting Started',
      badgeColor: '#4f46e5',
      description: 'Install data-importer via npm, pnpm, or yarn, and import the core styling stylesheet in your application entry file (main.tsx or App.tsx).',
      code: `# NPM
npm install data-importer

# PNPM
pnpm add data-importer

# Yarn
yarn add data-importer

// In main.tsx or App.tsx
import 'data-importer/styles.css';`
    },
    {
      id: 'zip-dual-upload',
      category: 'zip-workflow',
      title: '2. High-Volume Dual Upload: 10,000 Users (CSV) + 20,000 Images (ZIP)',
      badge: 'Dual Upload Gate',
      badgeColor: '#7c3aed',
      description: 'Enables high-performance companion ZIP upload. When enableZipUpload is true, the user MUST upload both CSV data spreadsheet and ZIP archive before column mapping can begin. Central Directory inspection parses 20,000 file entries in <15ms with zero browser memory bloat.',
      code: `import React from 'react';
import { DataImporter, ImporterSchema } from 'data-importer/react';
import 'data-importer/styles.css';

// 1. Define schema including photo and signature filename columns
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
    description: 'Name of image file inside the companion ZIP (e.g. CAND_001_photo.jpg)'
  },
  { 
    key: 'signature', 
    label: 'Signature Filename', 
    type: 'string', 
    required: true,
    description: 'Name of signature file inside the companion ZIP (e.g. CAND_001_sign.png)'
  }
];

export const CandidateBulkImporter = () => {
  return (
    <DataImporter
      schema={candidateSchema}
      // 🔑 Activates Dual Upload Mode (Requires both CSV and ZIP before mapping)
      enableZipUpload={true}
      zipUploadLabel="Upload ZIP containing all 20,000 candidate photos and signatures"
      // 🔑 Columns that should be automatically cross-validated against ZIP file names
      zipAssetColumns={['photo', 'signature']}
      onImport={async (rows, onProgress, meta) => {
        // 'rows': Cleaned & validated 10,000 user rows (JSON)
        // 'meta.file': Original CSV File object
        // 'meta.zipFile': Original ZIP File object containing the 20,000 images
        console.log(\`Ready to send \${rows.length} records and ZIP: \${meta?.zipFile?.name}\`);
      }}
    />
  );
};`
    },
    {
      id: 'backend-formdata',
      category: 'backend-integration',
      title: '3. Real-Time Backend Method 1: Standard Multipart FormData Upload',
      badge: 'Direct API Upload',
      badgeColor: '#059669',
      description: 'Sends cleaned candidate rows as JSON alongside both the raw CSV file and companion ZIP archive in a single multipart/form-data HTTP request with live upload progress tracking.',
      code: `// =========================================================================
// 🚀 FRONTEND IMPLEMENTATION (React onImport Handler)
// =========================================================================
const handleImportWithFormData = async (rows, onProgress, meta) => {
  const formData = new FormData();

  // 1. Cleaned, validated, and column-mapped JSON records (10k candidates)
  formData.append('data', JSON.stringify(rows));

  // 2. Original CSV/Excel spreadsheet
  if (meta?.file) {
    formData.append('csvFile', meta.file);
  }

  // 3. Companion ZIP archive containing 20k photos & signatures
  if (meta?.zipFile) {
    formData.append('zipFile', meta.zipFile);
  }

  // 4. Send via Axios / fetch with upload progress tracking
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

// =========================================================================
// 🖥️ BACKEND IMPLEMENTATION (Node.js / Express + Multer)
// =========================================================================
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
      const candidates = JSON.parse(req.body.data); // Cleaned 10,000 JSON records
      const zipFile = req.files['zipFile']?.[0];    // Uploaded 20,000 image ZIP archive

      console.log(\`Received \${candidates.length} candidate rows and ZIP \${zipFile?.originalname}\`);

      // Extract ZIP stream to storage (S3 bucket or local volume)
      if (zipFile) {
        fs.createReadStream(zipFile.path)
          .pipe(unzipper.Extract({ path: \`/data/assets/\${req.body.batchId || 'batch-1'}\` }));
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
);`
    },
    {
      id: 'backend-s3-presigned',
      category: 'backend-integration',
      title: '4. Real-Time Backend Method 2: Cloud Storage / S3 Presigned URL (Enterprise Recommended 🚀)',
      badge: 'S3 Presigned',
      badgeColor: '#d97706',
      description: 'Recommended for 10k-50k users and 100MB-500MB ZIP files. The browser uploads the large ZIP archive directly to AWS S3 / GCS, preventing web server timeouts, memory exhaustion, and reverse-proxy payload limits.',
      code: `// =========================================================================
// 🚀 FRONTEND IMPLEMENTATION (Direct S3 Upload + Async Job Dispatch)
// =========================================================================
const handleImportWithPresignedUrl = async (rows, onProgress, meta) => {
  // Step 1: Request S3 Presigned URLs from backend
  const { data: presignedData } = await axios.post('/api/v1/uploads/presigned-url', {
    zipFileName: meta?.zipFile?.name,
    zipContentType: meta?.zipFile?.type || 'application/zip',
    totalCandidates: rows.length
  });

  const { zipUploadUrl, zipS3Key, batchId } = presignedData;

  // Step 2: Directly PUT ZIP archive to Amazon S3 with upload progress
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

  // Step 3: Trigger background worker (BullMQ / Celery / Kafka) with metadata
  const { data: jobResult } = await axios.post('/api/v1/candidates/process-batch', {
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

// =========================================================================
// 🖥️ BACKEND IMPLEMENTATION (Python / FastAPI + AWS S3 Boto3)
// =========================================================================
from fastapi import FastAPI, BackgroundTasks
import boto3

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
    # Enqueue background task to extract ZIP from S3 and insert candidates
    background_tasks.add_task(extract_zip_and_save_candidates, payload['zipS3Key'], payload['candidates'])
    return {'status': 'processing', 'batchId': payload['batchId']}`
    },
    {
      id: 'backend-chunked-stream',
      category: 'backend-integration',
      title: '5. Real-Time Backend Method 3: Chunked Streaming Uploads',
      badge: 'Chunked Ingestion',
      badgeColor: '#0284c7',
      description: 'Splits massive datasets (10,000+ rows) into micro-batches (e.g. 100 records per HTTP request) with automatic retry on failure and incremental progress updates.',
      code: `import { DataImporter, uploadInChunks } from 'data-importer/react';

// Option A: Enable declarative chunking in DataImporter component
<DataImporter
  schema={candidateSchema}
  chunkSize={100} // Automatically transmits 100 records per HTTP request
  enableZipUpload={true}
  onUploadChunk={async (chunkRows, meta) => {
    // meta.chunkIndex: Current chunk number (0, 1, 2...)
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
    retries: 3, // Auto retry up to 3 times on network failure
    onProgress: (p) => {
      console.log(\`Ingested \${p.processed} of \${p.total} (\${p.percentage}%)\`);
    }
  }
);`
    },
    {
      id: 'modal-component',
      category: 'ui-components',
      title: '6. Drop-in Modal Dialog (DataImporterModal)',
      badge: 'Ready Modal',
      badgeColor: '#3b82f6',
      description: 'Full pre-built modal with backdrop, header stepper, drag & drop, spreadsheet grid editor, and result views.',
      code: `import React, { useState } from 'react';
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

export const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Import Users</button>

      <DataImporterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Upload Candidate Data & Photos"
        schema={schema}
        enableZipUpload={true}
        zipAssetColumns={['photo', 'signature']}
        onImport={async (rows, onProgress, meta) => {
          return await api.submitBulkImport(rows, meta?.zipFile);
        }}
        onComplete={(result) => {
          alert(\`Successfully imported \${result.importedRows} rows!\`);
          setIsOpen(false);
        }}
      />
    </>
  );
};`
    },
    {
      id: 'headless-hook',
      category: 'ui-components',
      title: '7. Headless Hook (100% Custom UI Design)',
      badge: 'useDataImporter',
      badgeColor: '#ec4899',
      description: 'Build your own custom wizard, steps, buttons, dropzones, and review tables while leveraging the core validation, parsing, ZIP inspection, and undo/redo state machine.',
      code: `import React from 'react';
import { useDataImporter } from 'data-importer/react';

export const CustomImporterWizard = ({ schema }) => {
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
    import: runImport
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
      {currentStep === 'upload' && (
        <div>
          {/* CSV File Input */}
          <input type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
          {/* ZIP Archive Input */}
          <input type="file" accept=".zip" onChange={(e) => e.target.files?.[0] && loadZipFile(e.target.files[0])} />

          {/* Gated Proceed Button: Only active when both CSV and ZIP are loaded */}
          <button
            disabled={!file || !zipFile}
            onClick={() => proceedToMapping()}
          >
            Proceed to Column Mapping →
          </button>
        </div>
      )}

      {currentStep === 'mapping' && (
        <button onClick={autoMap}>Auto-Map Columns</button>
      )}

      {currentStep === 'review' && (
        <div>
          <h3>Reviewing {rows.length} rows ({statistics.invalid} errors)</h3>
          <button onClick={() => runImport()} disabled={statistics.invalid > 0}>
            Start Ingestion
          </button>
        </div>
      )}
    </div>
  );
};`
    },
    {
      id: 'api-response-schema',
      category: 'api-contract',
      title: '8. Backend Payload & Response Contract (OpenAPI Specification)',
      badge: 'API Contract',
      badgeColor: '#059669',
      description: 'Exact JSON structure expected by the onImport handler for row-level success, partial failure isolation, and error export reporting.',
      code: `// Expected response format returned from your onImport backend API handler:
interface ImportResult {
  totalRows: number;      // Total number of rows evaluated
  importedRows: number;   // Number of rows successfully written to database
  failedRows: number;     // Number of rows that failed server-side validation/insertion
  duration?: number;      // Execution duration in milliseconds
  
  // Optional: Detailed row-level status for precise UI error highlighting
  rowResults?: Array<{
    rowId: string;        // ID matching the row from rows[i]._id or index
    success: boolean;     // Whether this specific record succeeded
    error?: string;       // Server error message (e.g. "Duplicate National ID in database")
  }>;
}

// Example successful response:
{
  "totalRows": 10000,
  "importedRows": 10000,
  "failedRows": 0,
  "duration": 1840
}

// Example partial success response (Invalid records downloadable via UI):
{
  "totalRows": 10000,
  "importedRows": 9998,
  "failedRows": 2,
  "rowResults": [
    { "rowId": "row-412", "success": false, "error": "Email already exists in database" },
    { "rowId": "row-899", "success": false, "error": "Signature file is corrupted" }
  ]
}`
    }
  ];

  const filteredSnippets = SNIPPETS.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ maxWidth: 1040, margin: '24px auto', padding: '0 20px', width: '100%' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 14,
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(15,23,42,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📖</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Data Importer Developer & Backend Guide
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.6, maxWidth: 840 }}>
          Everything you need to integrate <strong>data-importer</strong> in real-time production environments.
          Features dual-upload gating (10k candidate rows in CSV + 20k photo/signature files in ZIP),
          client-side ZIP inspection in &lt;15ms, and 3 enterprise real-time backend transmission patterns.
        </p>

        {/* Search bar inside hero */}
        <div style={{ marginTop: 20, maxWidth: 480 }}>
          <input
            type="text"
            placeholder="Search guides, code snippets, or backend patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#ffffff',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--c-border)'
        }}
      >
        {[
          { id: 'all', label: 'All Guides' },
          { id: 'zip-workflow', label: '📦 Dual ZIP Workflow (10k+20k)' },
          { id: 'backend-integration', label: '🚀 Real-Time Backend Uploads' },
          { id: 'ui-components', label: '🎨 UI Components & Hook' },
          { id: 'api-contract', label: '📋 API Specifications' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as DocCategory)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: selectedCategory === tab.id ? 'var(--c-primary)' : 'transparent',
              color: selectedCategory === tab.id ? '#ffffff' : 'var(--c-text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feature Architecture Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 24
        }}
      >
        <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🔒 Dual Upload Gating</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Column mapping remains disabled until BOTH data CSV and image ZIP archive are provided.
          </div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>⚡ Zero-Memory ZIP Reader</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Inspects End of Central Directory in &lt;15ms for 20k files without extracting or crashing browser tabs.
          </div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>☁️ S3 Presigned & FormData</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Ready-to-use patterns for direct S3 upload, Node.js Multer, and FastAPI async workers.
          </div>
        </div>
        <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📝 In-Grid Virtualized Editor</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Smooth 60fps keyboard editing (Ctrl+Z undo/redo) with dynamic duplicate recalculation.
          </div>
        </div>
      </div>

      {/* Code Snippets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {filteredSnippets.map((snippet) => (
          <div
            key={snippet.id}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid var(--c-border)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid var(--c-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: 6,
                    background: `${snippet.badgeColor || '#4f46e5'}15`,
                    color: snippet.badgeColor || '#4f46e5',
                    letterSpacing: '0.04em'
                  }}
                >
                  {snippet.badge}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  {snippet.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => copyCode(snippet.code, snippet.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: copiedId === snippet.id ? '#10b981' : '#ffffff',
                  color: copiedId === snippet.id ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedId === snippet.id ? '✓ Copied to Clipboard!' : '📋 Copy Code'}
              </button>
            </div>

            {/* Description */}
            <div
              style={{
                padding: '12px 20px',
                fontSize: 13,
                color: '#475569',
                background: '#ffffff',
                borderBottom: '1px solid #f1f5f9',
                lineHeight: 1.5
              }}
            >
              {snippet.description}
            </div>

            {/* Code Block */}
            <pre
              style={{
                margin: 0,
                padding: '18px 22px',
                background: '#090d16',
                color: '#f1f5f9',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                overflowX: 'auto',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12
              }}
            >
              <code>{snippet.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
