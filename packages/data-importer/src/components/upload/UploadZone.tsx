import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { IconUpload, IconAlertCircle } from '../common/Icons';

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFiles?: string[];
  maxFileSize?: number;
  isLoading?: boolean;
  loadingMessage?: string | null;
  error?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  acceptedFiles = ['csv', 'tsv', 'xls', 'xlsx'],
  maxFileSize = 50 * 1024 * 1024,
  isLoading = false,
  loadingMessage,
  error
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="di-upload-container">
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
