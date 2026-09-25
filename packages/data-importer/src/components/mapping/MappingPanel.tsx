import React from 'react';
import { ColumnMapping, ImporterSchema } from '../../types';
import { IconCheck, IconAlertCircle, IconAlertTriangle } from '../common/Icons';

export interface MappingPanelProps {
  mappings: ColumnMapping[];
  schema: ImporterSchema;
  onUpdateMapping: (source: string, target: string | null) => void;
  onAutoMap: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const MappingPanel: React.FC<MappingPanelProps> = ({
  mappings,
  schema,
  onUpdateMapping,
  onAutoMap,
  onConfirm,
  isLoading = false
}) => {
  // Check required fields
  const mappedTargets = new Set(mappings.map((m) => m.targetField).filter(Boolean));
  const missingRequired = schema.filter((col) => col.required && !mappedTargets.has(col.key));

  return (
    <div className="di-mapping-container">
      <div className="di-mapping-header">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--di-text)' }}>
            Map Columns
          </h2>
          <p style={{ fontSize: 13, color: 'var(--di-text-secondary)', margin: '4px 0 0 0' }}>
            Match the columns from your uploaded document to the required target schema attributes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onAutoMap}
            disabled={isLoading}
          >
            Auto Match All
          </button>
        </div>
      </div>

      {missingRequired.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 16px',
            backgroundColor: 'var(--di-warning-light)',
            color: '#92400e',
            borderRadius: 'var(--di-radius-md)',
            border: '1px solid var(--di-warning)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13
          }}
        >
          <IconAlertTriangle size={18} />
          <span>
            <strong>Required fields unmapped:</strong> {missingRequired.map((f) => f.label).join(', ')}. Please assign these columns before continuing.
          </span>
        </div>
      )}

      <div style={{ border: '1px solid var(--di-border)', borderRadius: 'var(--di-radius-md)', overflowX: 'auto', backgroundColor: 'var(--di-surface)' }}>
        <table className="di-mapping-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Source Column</th>
              <th style={{ width: '30%' }}>Target Field</th>
              <th style={{ width: '15%' }}>Confidence</th>
              <th style={{ width: '15%' }}>Strategy</th>
              <th style={{ width: '15%' }}>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => {
              const matchedCol = schema.find((c) => c.key === mapping.targetField);
              const isMapped = !!mapping.targetField;
              const confidencePct = Math.round(mapping.confidence * 100);

              let confidenceColor = 'var(--di-muted)';
              if (confidencePct >= 80) confidenceColor = 'var(--di-success)';
              else if (confidencePct >= 50) confidenceColor = 'var(--di-warning)';
              else if (confidencePct > 0) confidenceColor = 'var(--di-error)';

              return (
                <tr key={mapping.sourceColumn}>
                  <td style={{ fontWeight: 600, color: 'var(--di-text)' }}>
                    {mapping.sourceColumn}
                  </td>
                  <td>
                    <select
                      className="di-mapping-select"
                      value={mapping.targetField || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : e.target.value;
                        onUpdateMapping(mapping.sourceColumn, val);
                      }}
                      aria-label={`Map ${mapping.sourceColumn}`}
                    >
                      <option value="">(Ignore / Do not import)</option>
                      {schema.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label} {col.required ? '*' : ''} ({col.type})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {isMapped ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          fontSize: 12,
                          color: confidenceColor
                        }}
                      >
                        {confidencePct >= 80 ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconAlertCircle size={14} />
                        )}
                        {confidencePct}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--di-muted)', fontSize: 12 }}>Unmapped</span>
                    )}
                  </td>
                  <td>
                    {isMapped ? (
                      <span className="di-badge">
                        {mapping.strategy}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--di-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--di-text-secondary)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mapping.sampleValues && mapping.sampleValues.length > 0
                      ? mapping.sampleValues.slice(0, 3).join(', ')
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          type="button"
          className="di-btn di-btn-primary"
          onClick={onConfirm}
          disabled={isLoading || missingRequired.length > 0}
        >
          {isLoading ? 'Preparing Data...' : 'Confirm Mapping & Review Data'}
        </button>
      </div>
    </div>
  );
};
