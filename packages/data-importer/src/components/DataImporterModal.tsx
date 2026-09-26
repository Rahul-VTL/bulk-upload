import React, { useEffect } from 'react';
import { DataImporter, DataImporterProps } from './DataImporter';
import { IconX } from './common/Icons';

export interface DataImporterModalProps extends DataImporterProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  modalWidth?: string | number;
  modalHeight?: string | number;
  closeOnBackdropClick?: boolean;
}

export const DataImporterModal: React.FC<DataImporterModalProps> = ({
  isOpen,
  onClose,
  title = 'Import Data',
  modalWidth = '92vw',
  modalHeight = '88vh',
  closeOnBackdropClick = true,
  theme,
  style,
  ...importerProps
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{
          width: modalWidth,
          maxWidth: '1200px',
          height: modalHeight,
          maxHeight: '92vh',
          backgroundColor: theme?.surface || '#ffffff',
          borderRadius: theme?.radiusLg || '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${theme?.border || '#e2e8f0'}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: theme?.surfaceSecondary || '#f8fafc',
            borderBottom: `1px solid ${theme?.border || '#e2e8f0'}`,
            flexShrink: 0
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15, color: theme?.text || '#0f172a' }}>
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme?.textSecondary || '#64748b',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
            aria-label="Close dialog"
            title="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Importer Engine Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DataImporter
            {...importerProps}
            theme={theme}
            onCancel={() => {
              if (importerProps.onCancel) {
                importerProps.onCancel();
              }
              onClose();
            }}
            onComplete={(result) => {
              if (importerProps.onComplete) {
                importerProps.onComplete(result);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
