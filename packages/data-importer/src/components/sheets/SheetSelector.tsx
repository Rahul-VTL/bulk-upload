import React, { useState } from 'react';
import { SheetInfo } from '../../types';
import { IconFile, IconCheck } from '../common/Icons';

export interface SheetSelectorProps {
  sheets: SheetInfo[];
  selectedSheetId: string | null;
  onSelectSheet: (sheetId: string) => void;
  isLoading?: boolean;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  sheets,
  selectedSheetId,
  onSelectSheet,
  isLoading = false
}) => {
  const [currentId, setCurrentId] = useState<string>(
    selectedSheetId || (sheets[0] ? sheets[0].id : '')
  );

  const selectedSheet = sheets.find((s) => s.id === currentId) || sheets[0];

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--di-text)' }}>
          Select Worksheet
        </h2>
        <p style={{ fontSize: 14, color: 'var(--di-text-secondary)', marginBottom: 24 }}>
          This workbook contains multiple sheets. Choose the sheet you would like to import.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          {sheets.map((sheet) => {
            const isSelected = sheet.id === currentId;
            return (
              <div
                key={sheet.id}
                onClick={() => setCurrentId(sheet.id)}
                style={{
                  padding: 16,
                  borderRadius: 'var(--di-radius-md)',
                  border: `2px solid ${isSelected ? 'var(--di-primary)' : 'var(--di-border)'}`,
                  backgroundColor: isSelected ? 'var(--di-primary-light)' : 'var(--di-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IconFile size={22} className={isSelected ? 'text-primary' : ''} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--di-text)' }}>
                      {sheet.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--di-text-secondary)', marginTop: 2 }}>
                      {sheet.rowCount} rows · {sheet.columnCount} columns
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: 'var(--di-primary)' }}>
                    <IconCheck size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedSheet && selectedSheet.sampleRows && selectedSheet.sampleRows.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--di-text-secondary)', marginBottom: 12 }}>
              Worksheet Preview ({selectedSheet.name})
            </h3>
            <div style={{ border: '1px solid var(--di-border)', borderRadius: 'var(--di-radius-md)', overflowX: 'auto', backgroundColor: 'var(--di-surface)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--di-surface-secondary)' }}>
                    {Object.keys(selectedSheet.sampleRows[0]).map((h) => (
                      <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid var(--di-border)', textAlign: 'left', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSheet.sampleRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--di-border)' }}>
                      {Object.keys(selectedSheet.sampleRows![0]).map((h) => (
                        <td key={h} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="di-btn di-btn-primary"
            disabled={isLoading || !currentId}
            onClick={() => onSelectSheet(currentId)}
          >
            {isLoading ? 'Loading Sheet...' : 'Continue with Selected Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
