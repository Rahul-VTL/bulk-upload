import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { IconUpload, IconAlertCircle } from '../common/Icons';

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFiles?: string[];
  maxFileSize?: number;
  isLoading?: boolean;
  loadingMessage?: string | null;
  error?: string | null;
  enableZipUpload?: boolean;
  zipUploadLabel?: string;
  file?: File | null;
  fileName?: string | null;
  fileRowCount?: number | null;
  zipFile?: File | null;
  zipFileCount?: number | null;
  onZipSelect?: (file: File) => void;
  onZipRemove?: () => void;
  onProceedToMapping?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  acceptedFiles = ['csv', 'tsv', 'xls', 'xlsx'],
  maxFileSize = 50 * 1024 * 1024,
  isLoading = false,
  loadingMessage,
  error,
  enableZipUpload = false,
  zipUploadLabel,
  file,
  fileName,
  fileRowCount,
  zipFile,
  zipFileCount,
  onZipSelect,
  onZipRemove,
  onProceedToMapping
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isZipDragActive, setIsZipDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const maxMb = Math.round(maxFileSize / (1024 * 1024));
  const acceptAttr = acceptedFiles.map((ext) => `.${ext.replace(/^\./, '')}`).join(',');

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  // --- ZIP Handlers ---
  const handleZipDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZipDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onZipSelect) {
      onZipSelect(e.dataTransfer.files[0]);
    }
  };

  const handleZipChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onZipSelect) {
      onZipSelect(e.target.files[0]);
    }
  };

  return (
    <div className="di-upload-container">
      {enableZipUpload ? (
        /* ============================================================ */
        /* 📦 DUAL UPLOAD MODE (CSV Spreadsheet + Companion ZIP Archive) */
        /* ============================================================ */
        <div style={{ width: '100%', maxWidth: 880 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              width: '100%'
            }}
          >
            {/* 1. CSV Dropzone */}
            <div
              className={`di-upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              role="button"
              tabIndex={0}
              style={{
                minHeight: 240,
                borderColor: file ? 'var(--di-success, #22c55e)' : undefined,
                backgroundColor: file ? 'var(--di-success-light, #f0fdf4)' : undefined
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                style={{ display: 'none' }}
                onChange={handleInputChange}
              />

              <div
                className="di-upload-icon"
                style={{
                  backgroundColor: file ? '#dcfce7' : undefined,
                  color: file ? 'var(--di-success, #16a34a)' : undefined
                }}
              >
                <IconUpload size={26} />
              </div>

              <div className="di-upload-title" style={{ fontSize: 15 }}>
                {isLoading
                  ? loadingMessage || 'Processing...'
                  : file
                  ? `✓ ${fileName || file.name}`
                  : '1. Data Spreadsheet'}
              </div>

              {file && !isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      background: '#bbf7d0',
                      color: '#166534',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}
                  >
                    {fileRowCount !== null ? `${fileRowCount} Rows Loaded` : 'Spreadsheet Ready'}
                  </span>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerBrowse();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--di-primary, #3b82f6)',
                        fontSize: 11,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Change File
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="di-upload-subtitle" style={{ fontSize: 12 }}>
                    Upload CSV or Excel file containing record metadata
                  </div>

                  <button
                    type="button"
                    className="di-btn di-btn-primary"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerBrowse();
                    }}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    Browse Data File
                  </button>

                  <div className="di-upload-badges">
                    {acceptedFiles.map((ext) => (
                      <span key={ext} className="di-badge">
                        .{ext.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. ZIP Dropzone */}
            <div
              className={`di-upload-dropzone ${isZipDragActive ? 'drag-active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsZipDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsZipDragActive(false);
              }}
              onDrop={handleZipDrop}
              onClick={() => zipInputRef.current?.click()}
              role="button"
              tabIndex={0}
              style={{
                minHeight: 240,
                borderColor: zipFile ? 'var(--di-success, #22c55e)' : undefined,
                backgroundColor: zipFile ? 'var(--di-success-light, #f0fdf4)' : undefined
              }}
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={handleZipChange}
              />

              <div
                className="di-upload-icon"
                style={{
                  backgroundColor: zipFile ? '#dcfce7' : undefined,
                  color: zipFile ? 'var(--di-success, #16a34a)' : undefined
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8v13H3V8"></path>
                  <path d="M1 3h22v5H1z"></path>
                  <path d="M10 12h4"></path>
                </svg>
              </div>

              <div className="di-upload-title" style={{ fontSize: 15 }}>
                {zipFile ? `✓ ${zipFile.name}` : '2. Photos & Signatures (ZIP)'}
              </div>

              {zipFile ? (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      background: '#bbf7d0',
                      color: '#166534',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}
                  >
                    {zipFileCount || 0} Files Verified in ZIP
                  </span>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZipRemove?.();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--di-error)',
                        fontSize: 11,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Remove ZIP
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="di-upload-subtitle" style={{ fontSize: 12 }}>
                    {zipUploadLabel || 'Archive containing candidate photos and signatures'}
                  </div>

                  <button
                    type="button"
                    className="di-btn di-btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      zipInputRef.current?.click();
                    }}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    Browse ZIP File
                  </button>

                  <div className="di-upload-badges">
                    <span className="di-badge">.ZIP</span>
                    <span className="di-badge" style={{ textTransform: 'none' }}>Up to 500MB</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dual Upload Gate Status & Action Bar */}
          {file && zipFile ? (
            <div
              style={{
                marginTop: 20,
                padding: '16px 20px',
                backgroundColor: 'var(--di-success-light, #f0fdf4)',
                border: '1.5px solid var(--di-success, #22c55e)',
                borderRadius: 'var(--di-radius-md, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                boxShadow: '0 2px 8px rgba(34,197,94,0.1)'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#166534', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✓</span> Both CSV Data and ZIP Archive Ready
                </div>
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                  Spreadsheet ({fileRowCount !== null ? `${fileRowCount} records` : 'ready'}) and companion ZIP archive ({zipFileCount || 0} files) are verified.
                </div>
              </div>
              <button
                type="button"
                className="di-btn di-btn-primary"
                onClick={onProceedToMapping}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '10px 22px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Proceed to Field Mapping →
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: '14px 18px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--di-radius-md, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#92400e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚠️</span>
                  {!file && !zipFile
                    ? 'Both CSV Data File and Companion ZIP Archive are Required'
                    : !file
                    ? 'Spreadsheet File (CSV/Excel) Still Required'
                    : 'Companion ZIP Archive Still Required'}
                </div>
                <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                  {!file && !zipFile
                    ? 'Please upload both files above before you can proceed to column mapping.'
                    : !file
                    ? `ZIP archive attached (${zipFileCount || 0} files). Please upload data spreadsheet to continue.`
                    : `CSV loaded (${fileRowCount !== null ? `${fileRowCount} records` : 'ready'}). Please upload companion ZIP to continue.`}
                </div>
              </div>
              <button
                type="button"
                className="di-btn"
                disabled
                title="Both files must be uploaded before mapping can begin"
                style={{
                  whiteSpace: 'nowrap',
                  padding: '9px 18px',
                  fontSize: 13,
                  opacity: 0.55,
                  cursor: 'not-allowed',
                  backgroundColor: '#e2e8f0',
                  color: '#64748b',
                  border: 'none',
                  fontWeight: 500
                }}
              >
                Proceed to Field Mapping →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* 📄 STANDARD SINGLE UPLOAD MODE (Default: Only CSV / Excel)   */
        /* ============================================================ */
        <div
          className={`di-upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerBrowse();
            }
          }}
          aria-label="Upload file dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            style={{ display: 'none' }}
            onChange={handleInputChange}
            aria-hidden="true"
          />

          <div className="di-upload-icon">
            <IconUpload size={28} />
          </div>

          <div className="di-upload-title">
            {isLoading ? loadingMessage || 'Processing file...' : 'Choose a file or drag & drop it here'}
          </div>

          <div className="di-upload-subtitle">
            Select a structured data spreadsheet to begin the import workflow
          </div>

          <button
            type="button"
            className="di-btn di-btn-primary"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              triggerBrowse();
            }}
          >
            Browse Files
          </button>

          <div className="di-upload-badges">
            {acceptedFiles.map((ext) => (
              <span key={ext} className="di-badge">
                .{ext.toUpperCase()}
              </span>
            ))}
            <span className="di-badge" style={{ textTransform: 'none' }}>
              Up to {maxMb}MB
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 16,
            maxWidth: 640,
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'var(--di-error-light)',
            color: 'var(--di-error)',
            borderRadius: 'var(--di-radius-md)',
            border: '1px solid var(--di-error)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13
          }}
          role="alert"
        >
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
