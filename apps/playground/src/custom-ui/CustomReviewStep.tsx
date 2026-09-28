import React, { useState } from 'react';
import { PresetConfig } from '../presets';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomReviewStepProps {
  api: UseDataImporterReturn;
  preset: PresetConfig;
}

export const CustomReviewStep: React.FC<CustomReviewStepProps> = ({ api, preset }) => {
  const {
    rows,
    rowIds,
    errors,
    rowErrors,
    warnings,
    duplicates,
    statistics,
    selectedRowIds,
    canUndo,
    canRedo,
    searchQuery
  } = api.state;

  const schema = preset.schema;

  // Local filter mode: 'all' | 'errors' | 'valid'
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'valid'>('all');

  // Compute displayed rows based on filter mode and search
  const visibleIndices: number[] = [];
  rowIds.forEach((id, idx) => {
    const hasError = !!rowErrors[id] && rowErrors[id].length > 0;
    if (filterMode === 'errors' && !hasError) return;
    if (filterMode === 'valid' && hasError) return;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const row = rows[idx];
      const match = schema.some((col) => {
        const val = row[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      });
      if (!match) return;
    }

    visibleIndices.push(idx);
  });

  const allSelected =
    visibleIndices.length > 0 &&
    visibleIndices.every((idx) => selectedRowIds.has(rowIds[idx]));

  const toggleSelectAll = () => {
    if (allSelected) {
      api.clearSelection();
    } else {
      visibleIndices.forEach((idx) => {
        api.toggleRowSelection(rowIds[idx], true);
      });
    }
  };

  const selectedCount = selectedRowIds.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Metric Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Total Records</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{rows.length}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534' }}>Valid Records</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-success)' }}>
            {statistics.valid}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b' }}>Validation Errors</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-error)' }}>
            {statistics.invalid}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
          <div style={{ fontSize: 12, color: '#5b21b6' }}>Duplicates</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-purple)' }}>
            {duplicates.size}
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid var(--c-border)'
        }}
      >
        {/* Left: Search & Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search in records..."
              value={searchQuery}
              onChange={(e) => api.setSearch(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                borderRadius: 6,
                border: '1px solid var(--c-border)',
                fontSize: 13,
                outline: 'none',
                width: 200
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: 7, fontSize: 13, color: '#94a3b8' }}>
              🔍
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 2, borderRadius: 6 }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                background: filterMode === 'all' ? '#ffffff' : 'transparent',
                color: filterMode === 'all' ? 'var(--c-primary)' : 'var(--c-text-muted)'
              }}
            >
              All ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('errors')}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                background: filterMode === 'errors' ? '#ffffff' : 'transparent',
                color: filterMode === 'errors' ? 'var(--c-error)' : 'var(--c-text-muted)'
              }}
            >
              Errors ({statistics.invalid})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('valid')}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                background: filterMode === 'valid' ? '#ffffff' : 'transparent',
                color: filterMode === 'valid' ? 'var(--c-success)' : 'var(--c-text-muted)'
              }}
            >
              Valid ({statistics.valid})
            </button>
          </div>
        </div>

        {/* Right: History, Add Row, Delete, Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Undo / Redo */}
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={api.undo}
            disabled={!canUndo}
            style={{ padding: '6px 10px', fontSize: 13 }}
            title="Undo edit (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={api.redo}
            disabled={!canRedo}
            style={{ padding: '6px 10px', fontSize: 13 }}
            title="Redo edit (Ctrl+Y)"
          >
            ↪ Redo
          </button>

          {/* Add Row */}
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={() => api.addRow()}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            + Add Row
          </button>

          {/* Delete Selected */}
          {selectedCount > 0 && (
            <button
              type="button"
              className="c-btn c-btn-danger"
              onClick={() => {
                api.deleteRows(Array.from(selectedRowIds));
                api.clearSelection();
              }}
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              🗑 Delete ({selectedCount})
            </button>
          )}

          {/* Export Errors */}
          {statistics.invalid > 0 && (
            <button
              type="button"
              className="c-btn c-btn-secondary"
              onClick={() => api.exportErrors('csv')}
              style={{ padding: '6px 12px', fontSize: 13 }}
              title="Download CSV of error rows"
            >
              📥 Export Errors CSV
            </button>
          )}
        </div>
      </div>

      {/* 3. Custom Spreadsheet Table */}
      <div className="c-table-wrapper">
        <table className="c-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: 45, textAlign: 'center' }}>#</th>
              {schema.map((col) => (
                <th key={col.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{col.label}</span>
                    {col.required && <span style={{ color: 'var(--c-error)' }}>*</span>}
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>
                      ({col.type})
                    </span>
                  </div>
                </th>
              ))}
              <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleIndices.length === 0 ? (
              <tr>
                <td
                  colSpan={schema.length + 3}
                  style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--c-text-muted)' }}
                >
                  No records match the current filter or search query.
                </td>
              </tr>
            ) : (
              visibleIndices.map((rowIndex) => {
                const rowId = rowIds[rowIndex];
                const row = rows[rowIndex];
                const isSelected = selectedRowIds.has(rowId);
                const hasRowError = !!rowErrors[rowId] && rowErrors[rowId].length > 0;
                const isDuplicate = duplicates.has(rowId);

                return (
                  <tr
                    key={rowId}
                    className={`${hasRowError ? 'row-has-error' : ''} ${isSelected ? 'row-selected' : ''}`}
                  >
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => api.toggleRowSelection(rowId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>

                    {/* Row Index */}
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                      {rowIndex + 1}
                    </td>

                    {/* Data Cells */}
                    {schema.map((col) => {
                      const cellKey = `${rowId}:${col.key}`;
                      const cellErrors = errors[cellKey];
                      const cellWarnings = warnings[cellKey];
                      const hasCellError = cellErrors && cellErrors.length > 0;
                      const hasCellWarning = cellWarnings && cellWarnings.length > 0;
                      const rawVal = row[col.key];
                      const displayVal = rawVal === null || rawVal === undefined ? '' : String(rawVal);

                      return (
                        <td
                          key={col.key}
                          style={{
                            background: hasCellError ? 'var(--c-error-light)' : undefined
                          }}
                        >
                          {/* Enum Dropdown or Input */}
                          {col.type === 'enum' && col.options ? (
                            <select
                              value={displayVal}
                              onChange={(e) => api.updateCell(rowId, col.key, e.target.value)}
                              className="c-cell-input"
                              style={{
                                border: hasCellError ? '1px solid var(--c-error)' : '1px solid #e2e8f0',
                                background: '#ffffff'
                              }}
                            >
                              <option value="">(Select {col.label})</option>
                              {col.options.map((opt) => (
                                <option key={String(opt.value)} value={String(opt.value)}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={displayVal}
                              onChange={(e) => api.updateCell(rowId, col.key, e.target.value)}
                              className="c-cell-input"
                              style={{
                                border: hasCellError ? '1px solid var(--c-error)' : undefined
                              }}
                            />
                          )}

                          {/* Cell Error Tooltip */}
                          {hasCellError && (
                            <div className="c-cell-error-box">
                              <span>⚠️</span>
                              <span>{cellErrors[0].message}</span>
                            </div>
                          )}

                          {/* Cell Warning Tooltip */}
                          {hasCellWarning && !hasCellError && (
                            <div className="c-cell-warning-box">
                              <span>ℹ️</span>
                              <span>{cellWarnings[0].message}</span>
                            </div>
                          )}

                          {/* Duplicate Indicator */}
                          {isDuplicate && col.unique && (
                            <div className="c-cell-error-box" style={{ color: 'var(--c-purple)' }}>
                              <span>👥</span>
                              <span>Duplicate entry</span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions (Duplicate / Delete) */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => api.duplicateRow(rowId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 2
                          }}
                          title="Duplicate row"
                        >
                          📋
                        </button>
                        <button
                          type="button"
                          onClick={() => api.deleteRows([rowId])}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: 2,
                            color: 'var(--c-error)'
                          }}
                          title="Delete row"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Review Summary & Submit Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid var(--c-border)'
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
          {statistics.invalid > 0 ? (
            <span style={{ color: 'var(--c-error)', fontWeight: 600 }}>
              ⚠️ Fix {statistics.invalid} row error(s) before importing, or click cells to correct them in real-time.
            </span>
          ) : (
            <span style={{ color: 'var(--c-success)', fontWeight: 600 }}>
              ✓ All {rows.length} records are valid and ready to import!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={() => api.setStep('mapping')}
            style={{ padding: '10px 18px', fontSize: 14 }}
          >
            ← Back to Mapping
          </button>
          <button
            type="button"
            className="c-btn c-btn-primary"
            onClick={() => {
              api.import().catch((err) => {
                console.error('Import failed:', err);
              });
            }}
            disabled={statistics.invalid > 0 || rows.length === 0}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}
          >
            🚀 Import {rows.length} Records to Backend
          </button>
        </div>
      </div>
    </div>
  );
};
