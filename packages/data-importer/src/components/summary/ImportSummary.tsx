import React from 'react';
import { ImportProgress, ImportStatistics } from '../../types';
import { IconCheckCircle, IconAlertCircle, IconAlertTriangle, IconCopy } from '../common/Icons';

export interface ImportSummaryProps {
  statistics: ImportStatistics;
  progress: ImportProgress | null;
  isLoading: boolean;
  allowImportWithErrors?: boolean;
  allowImportWithWarnings?: boolean;
  onProceed: () => void;
  onBack: () => void;
}

export const ImportSummary: React.FC<ImportSummaryProps> = ({
  statistics,
  progress,
  isLoading,
  allowImportWithErrors = false,
  allowImportWithWarnings = true,
  onProceed,
  onBack
}) => {
  const hasErrors = statistics.invalid > 0;
  const hasWarnings = statistics.warnings > 0;
  const canProceed = !hasErrors || allowImportWithErrors;

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--di-text)' }}>
          {isLoading ? 'Importing Records...' : 'Ready to Import Data'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--di-text-secondary)', marginBottom: 28 }}>
          {isLoading
            ? 'Please wait while your verified records are submitted.'
            : 'Review the dataset verification summary below before executing final submission.'}
        </p>

        {/* Live Progress Bar if Importing */}
        {isLoading && progress && (
          <div
            style={{
              padding: 24,
              backgroundColor: 'var(--di-surface)',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-lg)',
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              <span>Import Progress</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div
              style={{
                height: 8,
                backgroundColor: 'var(--di-surface-secondary)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 12
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress.percentage}%`,
                  backgroundColor: 'var(--di-primary)',
                  transition: 'width 0.2s ease-in-out'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--di-text-secondary)' }}>
              <span>Processed: {progress.processed} of {progress.total}</span>
              <span>Success: {progress.successCount} | Failed: {progress.failureCount}</span>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--di-surface)',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-md)'
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--di-text-secondary)', marginBottom: 4 }}>
              Total Records
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--di-text)' }}>
              {statistics.total}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--di-surface)',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-md)'
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--di-success)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheckCircle size={16} />
              <span>Valid Records</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--di-success)' }}>
              {statistics.valid}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--di-surface)',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-md)'
            }}
          >
            <div style={{ fontSize: 12, color: hasErrors ? 'var(--di-error)' : 'var(--di-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconAlertCircle size={16} />
              <span>Invalid Cells / Errors</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: hasErrors ? 'var(--di-error)' : 'var(--di-text)' }}>
              {statistics.invalid}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--di-surface)',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-md)'
            }}
          >
            <div style={{ fontSize: 12, color: hasWarnings ? 'var(--di-warning)' : 'var(--di-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconAlertTriangle size={16} />
              <span>Warnings</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: hasWarnings ? 'var(--di-warning)' : 'var(--di-text)' }}>
              {statistics.warnings}
            </div>
          </div>
        </div>

        {hasErrors && !allowImportWithErrors && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--di-error-light)',
              color: 'var(--di-error)',
              borderRadius: 'var(--di-radius-md)',
              border: '1px solid var(--di-error)',
              marginBottom: 24,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <IconAlertCircle size={18} />
            <span>
              <strong>Cannot proceed:</strong> There are {statistics.invalid} error(s) remaining in the data. Please go back to the spreadsheet editor to correct them.
            </span>
          </div>
        )}

        {!isLoading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <button type="button" className="di-btn di-btn-secondary" onClick={onBack}>
              Back to Spreadsheet
            </button>
            <button
              type="button"
              className="di-btn di-btn-primary"
              disabled={!canProceed}
              onClick={onProceed}
            >
              Start Final Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
