import React, { useState } from 'react';
import { DataImporterModal, ImportProgress, ImportResult } from 'data-importer/react';
import { PresetConfig } from '../presets';

interface ModalDemoViewProps {
  selectedPreset: PresetConfig;
  handleImport: (
    rows: Record<string, unknown>[],
    onProgress: (p: ImportProgress) => void
  ) => Promise<ImportResult>;
}

export const ModalDemoView: React.FC<ModalDemoViewProps> = ({
  selectedPreset,
  handleImport
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [importedData, setImportedData] = useState<Record<string, unknown>[]>([]);

  const onImportWithCapture = async (
    rows: Record<string, unknown>[],
    onProgress: (p: ImportProgress) => void
  ): Promise<ImportResult> => {
    const res = await handleImport(rows, onProgress);
    setLastImportResult(res);
    setImportedData(rows);
    return res;
  };

  return (
    <div style={{ maxWidth: 880, margin: '30px auto', padding: '0 20px', width: '100%' }}>
      {/* Hero Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '32px 36px',
          border: '1px solid var(--c-border)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28
          }}
        >
          🪟
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Drop-in Modal Dialog Importer
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', maxWidth: 560, margin: '0 auto 24px', lineHeight: 1.6 }}>
          The easiest way to integrate bulk data importing into any production app.
          Click the button below to launch the modal with full spreadsheet editing, drag & drop, and validation.
        </p>

        {/* Trigger Button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>🚀 Open Data Importer Modal</span>
            <span
              style={{
                fontSize: 11,
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: 12
              }}
            >
              {selectedPreset.title}
            </span>
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
          Supports keyboard navigation (Esc to close), smooth backdrop blur, and custom modal sizing.
        </div>
      </div>

      {/* Last Import Results Banner */}
      {lastImportResult && (
        <div
          style={{
            marginTop: 24,
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #bbf7d0',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              background: '#f0fdf4',
              borderBottom: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 600, fontSize: 14 }}>
              <span>✓</span>
              <span>Latest Import Session Succeeded</span>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Duration: {(lastImportResult.duration / 1000).toFixed(2)}s
            </span>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Records</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{lastImportResult.totalRows}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#166534' }}>Imported</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{lastImportResult.importedRows}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Failed</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: lastImportResult.failedRows > 0 ? '#ef4444' : '#64748b' }}>
                {lastImportResult.failedRows}
              </div>
            </div>
          </div>

          {importedData.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', padding: '16px 20px', background: '#f8fafc' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                Payload Sample (First 3 records):
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 6,
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: 11,
                  maxHeight: 160,
                  overflowY: 'auto'
                }}
              >
                {JSON.stringify(importedData.slice(0, 3), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* The Actual Modal Component */}
      <DataImporterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Import ${selectedPreset.title} Records`}
        schema={selectedPreset.schema}
        onImport={onImportWithCapture}
        onComplete={(result) => {
          console.log('[Modal Demo] Completed:', result);
          setIsModalOpen(false);
        }}
        modalWidth="92vw"
        modalHeight="88vh"
      />
    </div>
  );
};
