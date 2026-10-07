import React, { useState } from 'react';

export const DocsGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const SNIPPETS = [
    {
      title: '1. Installation & CSS Setup',
      badge: 'Step 1',
      description: 'Install the package using your favorite package manager and import the stylesheet in your root application file (main.tsx or App.tsx).',
      code: `# NPM
npm install data-importer

# PNPM
pnpm add data-importer

# Yarn
yarn add data-importer`
    },
    {
      title: '2. Global CSS Import',
      badge: 'Required',
      description: 'Include the pre-built stylesheet in your main entry file (main.tsx, index.tsx, or App.tsx).',
      code: `// In main.tsx or App.tsx
import 'data-importer/styles.css';`
    },
    {
      title: '3. Pre-built Modal Dialog (Most Popular)',
      badge: 'Drop-in Modal',
      description: 'Open the importer inside an accessible modal dialog popup with backdrop blur and responsive sizing.',
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
          // Send validated rows to your backend API
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
};`
    },
    {
      title: '4. Embedded Fullscreen / In-Page Component',
      badge: 'Full UI',
      description: 'Embed the entire multi-step importer flow directly into any page, container, or layout with custom theme styles.',
      code: `import React from 'react';
import { DataImporter, ImporterSchema } from 'data-importer/react';
import 'data-importer/styles.css';

const schema: ImporterSchema = [
  { key: 'id', label: 'Employee ID', type: 'string', required: true },
  { key: 'department', label: 'Department', type: 'string', required: true },
  { key: 'salary', label: 'Annual Salary', type: 'number', min: 10000 }
];

export const EmbeddedImporterPage = () => {
  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <DataImporter
        schema={schema}
        chunkSize={100} // Automatic chunked transmission
        onImport={async (rows, onProgress) => {
          // Batch handler with progress updates
          for (let i = 0; i < rows.length; i += 50) {
            await uploadBatch(rows.slice(i, i + 50));
            onProgress({
              processed: i + 50,
              total: rows.length,
              percentage: Math.round(((i + 50) / rows.length) * 100),
              successCount: i + 50,
              failureCount: 0
            });
          }
        }}
        onCancel={() => window.history.back()}
      />
    </div>
  );
};`
    },
    {
      title: '5. Headless Hook (100% Custom UI Control)',
      badge: 'Headless Hook',
      description: 'Use the useDataImporter React hook to build your own custom UI steps, buttons, animations, and tables with full validation and state management.',
      code: `import React from 'react';
import { useDataImporter, ImporterSchema } from 'data-importer/react';

const schema: ImporterSchema = [
  { key: 'productCode', label: 'SKU / Code', type: 'string', required: true },
  { key: 'price', label: 'Price', type: 'number', required: true, min: 0 }
];

export const MyCustomImporter = () => {
  const {
    state,
    loadFile,
    selectSheet,
    updateMapping,
    autoMap,
    updateCell,
    undo,
    redo,
    deleteRows,
    exportErrors,
    import: runImport,
    reset
  } = useDataImporter({
    schema,
    onImport: async (rows) => {
      return await api.uploadProducts(rows);
    }
  });

  const { currentStep, rows, errors, statistics } = state;

  return (
    <div>
      {currentStep === 'upload' && (
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
      )}

      {currentStep === 'review' && (
        <div>
          <h3>Reviewing {rows.length} records ({statistics.invalid} errors)</h3>
          <button onClick={() => runImport()} disabled={statistics.invalid > 0}>
            Finish Import
          </button>
        </div>
      )}
    </div>
  );
};`
    },
    {
      title: '6. Chunked Streaming & Large File Uploads',
      badge: 'Chunk Uploads',
      description: 'Safely upload tens of thousands of rows in chunk batches with retries and progress updates.',
      code: `import { uploadInChunks } from 'data-importer';

// Automatically splits 50,000 records into chunks of 100 with retry logic
const result = await uploadInChunks(
  records,
  async (chunk, meta) => {
    return await api.postChunk({
      chunkIndex: meta.chunkIndex,
      totalChunks: meta.totalChunks,
      items: chunk
    });
  },
  {
    chunkSize: 100,
    retries: 3,
    onProgress: (p) => {
      console.log(\`Uploaded \${p.processed} of \${p.total} (\${p.percentage}%)\`);
    }
  }
);`
    }
  ];

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 20px', width: '100%' }}>
      {/* Intro Header */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: '24px 28px', border: '1px solid var(--c-border)', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>📚</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Data Importer Integration & Usage Guide
          </h2>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.6 }}>
          Learn how to install, configure, and use the <strong>data-importer</strong> package in any React project.
          Choose between the <strong>drop-in Modal dialog</strong>, <strong>full embedded component</strong>, or <strong>100% headless custom UI</strong>.
        </p>
      </div>

      {/* Feature Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>⚡ Multi-Format Support</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>CSV, TSV, Microsoft Excel (.xls, .xlsx) with sheet selection</div>
        </div>
        <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>🔍 Smart Validation</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Type checking, regex, min/max, enums, async custom validators & duplicate checks</div>
        </div>
        <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>📝 In-Grid Editing</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Live cell editing, undo/redo history (Ctrl+Z), row deletion & bulk selection</div>
        </div>
        <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>📦 Chunk Uploader</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Batch stream large datasets with auto-retry & error report download</div>
        </div>
      </div>

      {/* Code Snippets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SNIPPETS.map((snippet, idx) => (
          <div
            key={snippet.title}
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid var(--c-border)',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
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
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#e0e7ff',
                    color: '#3730a3'
                  }}
                >
                  {snippet.badge}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                  {snippet.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => copyCode(snippet.code, idx)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: copiedIndex === idx ? '#10b981' : '#ffffff',
                  color: copiedIndex === idx ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedIndex === idx ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            </div>

            {/* Description */}
            <div style={{ padding: '12px 20px', fontSize: 13, color: '#475569', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
              {snippet.description}
            </div>

            {/* Code Block */}
            <pre
              style={{
                margin: 0,
                padding: '16px 20px',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 13,
                lineHeight: 1.55,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                overflowX: 'auto'
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
