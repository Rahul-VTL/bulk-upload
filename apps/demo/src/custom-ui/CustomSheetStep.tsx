import React from 'react';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomSheetStepProps {
  api: UseDataImporterReturn;
}

export const CustomSheetStep: React.FC<CustomSheetStepProps> = ({ api }) => {
  const { sheets, selectedSheetId, fileName } = api.state;

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          Choose Worksheet
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>
          File <strong>{fileName}</strong> contains multiple sheets. Choose which sheet you want to import:
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {sheets.map((sheet) => {
          const isSelected = sheet.id === selectedSheetId;
          return (
            <div
              key={sheet.id}
              onClick={() => api.selectSheet(sheet.id)}
              style={{
                border: isSelected ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
                background: isSelected ? 'var(--c-primary-light)' : '#ffffff',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                {isSelected && (
                  <span style={{ fontSize: 12, background: 'var(--c-primary)', color: 'white', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                    Selected
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1e293b' }}>
                {sheet.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                {sheet.rowCount ?? 0} rows · {sheet.columnCount ?? 0} columns
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
