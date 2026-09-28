import React, { useState, useRef } from 'react';
import { PresetConfig } from '../presets';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomUploadStepProps {
  api: UseDataImporterReturn;
  preset: PresetConfig;
}

export const CustomUploadStep: React.FC<CustomUploadStepProps> = ({ api, preset }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      api.loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      api.loadFile(e.target.files[0]);
    }
  };

  const loadSample = (format: 'csv' | 'tsv') => {
    const content = format === 'csv' ? preset.sampleCsv : preset.sampleTsv;
    const mime = format === 'csv' ? 'text/csv' : 'text/tab-separated-values';
    const filename = `${preset.id}-sample.${format}`;
    const sampleFile = new File([content], filename, { type: mime });
    api.loadFile(sampleFile);
  };

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', width: '100%' }}>
      {/* Intro info */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          Upload Data File
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
          {preset.description}
        </p>
      </div>

      {/* Custom Dropzone */}
      <div
        className={`c-upload-dropzone ${isDragOver ? 'dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xls,.xlsx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="c-upload-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
          Drag & Drop your file here, or <span style={{ color: 'var(--c-primary)', textDecoration: 'underline' }}>Browse</span>
        </h3>
        <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 12 }}>
          Supports CSV, TSV, Microsoft Excel (.xls, .xlsx) up to 50 MB
        </p>

        {api.state.isLoading && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--c-primary)' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              Parsing and inspecting structure...
            </span>
          </div>
        )}
      </div>

      {/* Preset Quick Sample Loaders */}
      <div style={{ marginTop: 24, padding: '18px 20px', background: '#ffffff', borderRadius: 12, border: '1px solid var(--c-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🧪 Test instantly with pre-built test files:</span>
        </div>
        <div className="c-sample-pills">
          <button
            type="button"
            className="c-pill-btn"
            onClick={() => loadSample('csv')}
          >
            <span>📄 Load {preset.title} Sample CSV</span>
            <span style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 10 }}>
              Includes duplicates & validation errors
            </span>
          </button>
          <button
            type="button"
            className="c-pill-btn"
            onClick={() => loadSample('tsv')}
          >
            <span>📑 Load Sample TSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
