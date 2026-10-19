import React from 'react';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomResultStepProps {
  api: UseDataImporterReturn;
}

export const CustomResultStep: React.FC<CustomResultStepProps> = ({ api }) => {
  const { result, rows } = api.state;

  if (!result) return null;

  return (
    <div style={{ maxWidth: 680, margin: '30px auto', width: '100%' }}>
      {/* Top Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '36px 24px',
          textAlign: 'center',
          border: '1px solid #bbf7d0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          marginBottom: 24
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--c-success-light)',
            color: 'var(--c-success)',
            fontSize: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          ✓
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>
          Batch Import Completed Successfully!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
          All sanitized rows have been verified and processed by the system.
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginTop: 28,
            textAlign: 'left'
          }}
        >
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid var(--c-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Total Records</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{result.totalRows}</div>
          </div>

          <div style={{ background: 'var(--c-success-light)', padding: 14, borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, color: '#166534' }}>Imported</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-success)' }}>
              {result.importedRows}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid var(--c-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Duration</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              {(result.duration / 1000).toFixed(2)}s
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 28 }}>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={api.reset}
            style={{ padding: '10px 28px', fontSize: 15, fontWeight: 600 }}
          >
            ↺ Upload Another File
          </button>
        </div>
      </div>

      {/* JSON Payload Inspection Card */}
      <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--c-border)', background: '#f8fafc', fontWeight: 600, fontSize: 13 }}>
          📦 Imported Data Payload Preview ({rows.length} rows)
        </div>
        <pre
          style={{
            padding: 16,
            margin: 0,
            fontSize: 12,
            maxHeight: 260,
            overflow: 'auto',
            background: '#0f172a',
            color: '#e2e8f0',
            fontFamily: 'monospace'
          }}
        >
          {JSON.stringify(rows.slice(0, 5), null, 2)}
          {rows.length > 5 && `\n\n... and ${rows.length - 5} more records.`}
        </pre>
      </div>
    </div>
  );
};
