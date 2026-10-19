import React from 'react';
import { PresetConfig } from '../presets';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomMappingStepProps {
  api: UseDataImporterReturn;
  preset: PresetConfig;
}

export const CustomMappingStep: React.FC<CustomMappingStepProps> = ({ api, preset }) => {
  const { mappings, sourceHeaders } = api.state;
  const schema = preset.schema;

  // Find required fields and see if they are mapped
  const mappedTargets = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField)
  );

  const missingRequired = schema.filter(
    (col) => col.required && !mappedTargets.has(col.key)
  );

  const canProceed = missingRequired.length === 0;

  return (
    <div style={{ maxWidth: 860, margin: '10px auto', width: '100%' }}>
      {/* Step Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
            Column Mapping
          </h2>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            Match the columns from your file with the target system fields.
          </p>
        </div>

        <button
          type="button"
          className="c-btn c-btn-secondary"
          onClick={api.autoMap}
          style={{ fontSize: 13 }}
        >
          ✨ Run Auto-Mapper
        </button>
      </div>

      {/* Mandatory columns info banner */}
      <div
        style={{
          padding: '12px 16px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <div>
          <strong>Note:</strong> Target columns marked with an asterisk (<strong style={{ color: '#ef4444', fontSize: 15 }}>*</strong>) are <strong>mandatory</strong> and must be mapped to proceed.
        </div>
      </div>

      {/* Validation banner if required fields are missing */}
      {missingRequired.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--c-warning-light)',
            border: '1px solid #fde68a',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span>⚠️</span>
          <div>
            <strong>Missing required fields:</strong> Please map{' '}
            {missingRequired.map((f) => `"${f.label}"`).join(', ')} before continuing.
          </div>
        </div>
      )}

      {/* Mapping Rows */}
      <div className="c-mapping-grid">
        {mappings.map((mapping) => {
          const matchedTarget = schema.find((s) => s.key === mapping.targetField);

          return (
            <div key={mapping.sourceColumn} className="c-mapping-row">
              {/* Source Column & Preview */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                    {mapping.sourceColumn}
                  </span>
                  {mapping.confidence > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 600,
                        background:
                          mapping.confidence >= 0.9
                            ? 'var(--c-success-light)'
                            : 'var(--c-primary-light)',
                        color:
                          mapping.confidence >= 0.9
                            ? 'var(--c-success)'
                            : 'var(--c-primary)'
                      }}
                    >
                      {Math.round(mapping.confidence * 100)}% match
                    </span>
                  )}
                </div>

                {mapping.sampleValues && mapping.sampleValues.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Sample: <em>{mapping.sampleValues.slice(0, 2).map(String).join(', ')}</em>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 18 }}>
                →
              </div>

              {/* Target Field Dropdown */}
              <div>
                <select
                  value={mapping.targetField || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : e.target.value;
                    api.setMapping(mapping.sourceColumn, val);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--c-border)',
                    background: '#ffffff',
                    fontSize: 13,
                    color: mapping.targetField ? '#0f172a' : '#94a3b8',
                    outline: 'none',
                    fontWeight: 500
                  }}
                >
                  <option value="">(Ignore this column)</option>
                  {schema.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label} {col.required ? '* [Mandatory]' : ''} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Status / Type */}
              <div style={{ textAlign: 'right' }}>
                {matchedTarget ? (
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: matchedTarget.required ? '#fef2f2' : '#f1f5f9',
                        color: matchedTarget.required ? '#ef4444' : '#475569',
                        border: matchedTarget.required ? '1px solid rgba(239, 68, 68, 0.25)' : 'none',
                        fontWeight: 600
                      }}
                    >
                      {matchedTarget.required ? '* Mandatory' : 'Optional'}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Skipped</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="c-btn c-btn-secondary"
          onClick={() => {
            if (api.state.sheets.length > 1) {
              api.setStep('sheet-select');
            } else {
              api.setStep('upload');
            }
          }}
          disabled={api.state.isLoading}
          style={{ padding: '10px 20px', fontSize: 14 }}
        >
          ← Back
        </button>

        <button
          type="button"
          className="c-btn c-btn-primary"
          onClick={() => api.confirmMappingAndPrepare()}
          disabled={!canProceed || api.state.isLoading}
          style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}
        >
          {api.state.isLoading ? 'Preparing Grid...' : 'Confirm & Review Data →'}
        </button>
      </div>
    </div>
  );
};
