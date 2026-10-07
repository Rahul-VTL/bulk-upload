import React from 'react';
import { ImportResult } from '../../types';
import { IconCheckCircle, IconAlertCircle, IconDownload, IconRefreshCw } from '../common/Icons';

export interface ResultViewProps {
  result: ImportResult;
  onReset: () => void;
  onClose?: () => void;
  onBackToListing?: () => void;
  onDownloadInvalidRows?: (format?: 'csv' | 'xlsx') => void;
  backToListingLabel?: string;
  invalidCount?: number;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  onReset,
  onClose,
  onBackToListing,
  onDownloadInvalidRows,
  backToListingLabel = 'Back to Listing',
  invalidCount: propInvalidCount
}) => {
  const isFullSuccess = result.failedRows === 0 && (propInvalidCount === undefined || propInvalidCount === 0);
  const hasFailedRows =
    (propInvalidCount !== undefined && propInvalidCount > 0) ||
    result.failedRows > 0 ||
    result.invalidRows > 0 ||
    Boolean(result.rowResults && result.rowResults.some((r) => !r.success));
  const failedCount =
    propInvalidCount !== undefined && propInvalidCount > 0
      ? propInvalidCount
      : (result.failedRows || result.invalidRows || 0);

  return (
    <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          backgroundColor: 'var(--di-surface)',
          border: '1px solid var(--di-border)',
          borderRadius: 'var(--di-radius-lg)',
          padding: 32,
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: isFullSuccess ? 'var(--di-success-light)' : 'var(--di-warning-light)',
            color: isFullSuccess ? 'var(--di-success)' : 'var(--di-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          {isFullSuccess ? <IconCheckCircle size={36} /> : <IconAlertCircle size={36} />}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--di-text)' }}>
          {isFullSuccess ? 'Import Completed Successfully' : 'Import Finished with Warnings'}
        </h2>

        <p style={{ fontSize: 14, color: 'var(--di-text-secondary)', margin: '0 0 24px 0' }}>
          Your data import process completed in {(result.duration / 1000).toFixed(2)}s.
        </p>

        {/* Results grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--di-radius-md)',
              backgroundColor: 'var(--di-surface-secondary)'
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--di-text-secondary)', textTransform: 'uppercase' }}>
              Total Rows
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--di-text)', marginTop: 4 }}>
              {result.totalRows}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 'var(--di-radius-md)',
              backgroundColor: 'var(--di-success-light)'
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--di-success)', textTransform: 'uppercase' }}>
              Imported
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--di-success)', marginTop: 4 }}>
              {result.importedRows}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 'var(--di-radius-md)',
              backgroundColor: hasFailedRows ? 'var(--di-error-light)' : 'var(--di-surface-secondary)'
            }}
          >
            <div style={{ fontSize: 11, color: hasFailedRows ? 'var(--di-error)' : 'var(--di-text-secondary)', textTransform: 'uppercase' }}>
              Failed / Invalid
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: hasFailedRows ? 'var(--di-error)' : 'var(--di-text)', marginTop: 4 }}>
              {failedCount}
            </div>
          </div>
        </div>

        {/* Row results details if failure items exist */}
        {result.rowResults && result.rowResults.some((r) => !r.success) && (
          <div
            style={{
              textAlign: 'left',
              maxHeight: 160,
              overflowY: 'auto',
              border: '1px solid var(--di-border)',
              borderRadius: 'var(--di-radius-md)',
              padding: 12,
              fontSize: 12,
              marginBottom: 24,
              backgroundColor: 'var(--di-surface-secondary)'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--di-error)' }}>
              Row Failures:
            </div>
            {result.rowResults
              .filter((r) => !r.success)
              .map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  • Row {r.rowId}: {r.error || 'Validation error'}
                </div>
              ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          {hasFailedRows && (
            <button
              type="button"
              className="di-btn"
              onClick={() => {
                if (onDownloadInvalidRows) {
                  onDownloadInvalidRows('csv');
                }
              }}
              style={{
                backgroundColor: 'var(--di-error, #dc2626)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
              title="Download invalid and failed records with error reasons"
            >
              <IconDownload size={14} />
              Download Invalid Records {failedCount > 0 ? `(${failedCount})` : ''}
            </button>
          )}

          {(onBackToListing || onClose) && (
            <button
              type="button"
              className="di-btn di-btn-primary"
              onClick={onBackToListing || onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              {backToListingLabel}
            </button>
          )}

          <button
            type="button"
            className="di-btn di-btn-secondary"
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <IconRefreshCw size={14} />
            Import Another File
          </button>
        </div>
      </div>
    </div>
  );
};
