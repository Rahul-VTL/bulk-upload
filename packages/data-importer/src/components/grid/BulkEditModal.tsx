import React, { useState } from 'react';
import { ImporterSchema } from '../../types';
import { IconX } from '../common/Icons';

export interface BulkEditModalProps {
  schema: ImporterSchema;
  selectedRowIds: string[];
  onApply: (field: string, value: unknown) => void;
  onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  schema,
  selectedRowIds,
  onApply,
  onClose
}) => {
  const [selectedField, setSelectedField] = useState<string>(schema[0]?.key || '');
  const [newValue, setNewValue] = useState<string>('');

  const targetCol = schema.find((c) => c.key === selectedField);

  const handleConfirm = () => {
    onApply(selectedField, newValue);
    onClose();
  };

  return (
    <div className="di-modal-backdrop" onClick={onClose}>
      <div
        className="di-modal-dialog"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
      >
        <div className="di-modal-header">
          <h3 id="bulk-edit-title" className="di-modal-title">
            Bulk Edit Selected Rows
          </h3>
          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onClose}
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="di-modal-body">
          <p style={{ fontSize: 13, color: 'var(--di-text-secondary)', marginBottom: 16 }}>
            This change will be applied to{' '}
            <strong style={{ color: 'var(--di-text)' }}>{selectedRowIds.length}</strong> selected rows.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Target Column
            </label>
            <select
              className="di-mapping-select"
              style={{ width: '100%' }}
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              {schema.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              New Value
            </label>
            {targetCol?.options ? (
              <select
                className="di-mapping-select"
                style={{ width: '100%' }}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              >
                <option value="">(Select value)</option>
                {targetCol.options.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="di-input-search"
                style={{ width: '100%', backgroundColor: 'var(--di-surface)' }}
                placeholder="Enter replacement value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="di-modal-footer">
          <button type="button" className="di-btn di-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="di-btn di-btn-primary" onClick={handleConfirm}>
            Update {selectedRowIds.length} Rows
          </button>
        </div>
      </div>
    </div>
  );
};
