import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  KeyboardEvent
} from 'react';
import {
  ImporterSchema,
  ImporterState,
  GridCellPosition,
  FilterGroup,
  SortRule,
  SortDirection
} from '../../types';
import {
  IconSearch,
  IconFilter,
  IconUndo,
  IconRedo,
  IconPlus,
  IconTrash,
  IconCopy,
  IconDownload,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck
} from '../common/Icons';
import { FilterModal } from './FilterModal';
import { BulkEditModal } from './BulkEditModal';

export interface DataGridProps {
  state: ImporterState;
  schema: ImporterSchema;
  onUpdateCell: (rowId: string, field: string, value: unknown) => void;
  onUpdateCells: (changes: Array<{ rowId: string; field: string; value: unknown }>) => void;
  onAddRow: (data?: Record<string, unknown>) => void;
  onDeleteRows: (rowIds: string[]) => void;
  onDuplicateRow: (rowId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSetFilter: (filter: FilterGroup | null) => void;
  onSetSearch: (query: string) => void;
  onSetSorting: (sorting: SortRule[]) => void;
  onToggleRowSelection: (rowId: string, force?: boolean) => void;
  onSelectAllRows: () => void;
  onClearSelection: () => void;
  onExportErrors: (format: 'csv' | 'xlsx') => void;
  onValidate: () => void;
}

const ROW_HEIGHT = 34;
const OVERSCAN = 10;

type QuickFilterType = 'all' | 'errors' | 'warnings' | 'duplicates';

export const DataGrid: React.FC<DataGridProps> = ({
  state,
  schema,
  onUpdateCell,
  onUpdateCells,
  onAddRow,
  onDeleteRows,
  onDuplicateRow,
  onUndo,
  onRedo,
  onSetFilter,
  onSetSearch,
  onSetSorting,
  onToggleRowSelection,
  onSelectAllRows,
  onClearSelection,
  onExportErrors,
  onValidate
}) => {
  const [activeCell, setActiveCell] = useState<GridCellPosition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(500);

  // Compute filtered & sorted rows
  const displayRows = useMemo(() => {
    let baseRows = state.rows.map((row, index) => ({
      row,
      rowId: state.rowIds[index],
      originalIndex: index
    }));

    // Quick filter tab filter
    if (quickFilter === 'errors') {
      baseRows = baseRows.filter((it) => !!state.rowErrors[it.rowId]);
    } else if (quickFilter === 'warnings') {
      baseRows = baseRows.filter((it) => {
        return Object.keys(state.warnings).some((k) => k.startsWith(`${it.rowId}:`));
      });
    } else if (quickFilter === 'duplicates') {
      baseRows = baseRows.filter((it) => state.duplicates.has(it.rowId));
    }

    // Search filter
    if (state.searchQuery.trim().length > 0) {
      const q = state.searchQuery.toLowerCase().trim();
      baseRows = baseRows.filter((it) =>
        Object.values(it.row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Advanced FilterGroup filter
    if (state.filters && state.filters.rules.length > 0) {
      baseRows = baseRows.filter((it) => evaluateFilterGroup(it.row, state.filters!));
    }

    // Sorting
    if (state.sorting.length > 0) {
      baseRows.sort((a, b) => {
        for (const rule of state.sorting) {
          const field = rule.field;
          const dir = rule.direction === 'desc' ? -1 : 1;
          const valA = a.row[field];
          const valB = b.row[field];
          if (valA === valB) continue;
          if (valA === null || valA === undefined || valA === '') return 1 * dir;
          if (valB === null || valB === undefined || valB === '') return -1 * dir;

          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * dir;
          }
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          const cmp = strA.localeCompare(strB);
          if (cmp !== 0) return cmp * dir;
        }
        return a.originalIndex - b.originalIndex;
      });
    }

    return baseRows;
  }, [
    state.rows,
    state.rowIds,
    state.rowErrors,
    state.warnings,
    state.duplicates,
    state.searchQuery,
    state.filters,
    state.sorting,
    quickFilter
  ]);

  // Viewport tracking for Virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    const updateHeight = () => {
      setViewportHeight(el.clientHeight || 500);
    };

    updateHeight();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeight);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const totalRowCount = displayRows.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalRowCount,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleRows = displayRows.slice(startIndex, endIndex);
  const topPadding = startIndex * ROW_HEIGHT;
  const bottomPadding = Math.max(0, (totalRowCount - endIndex) * ROW_HEIGHT);

  // Sorting click handler
  const handleSortClick = (field: string) => {
    const existing = state.sorting.find((s) => s.field === field);
    if (!existing) {
      onSetSorting([{ field, direction: 'asc' }]);
    } else if (existing.direction === 'asc') {
      onSetSorting([{ field, direction: 'desc' }]);
    } else {
      onSetSorting([]);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;

    // Undo / Redo shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      onRedo();
      return;
    }

    if (!activeCell) return;

    const visibleCols = schema.map((c) => c.key);
    const colIndex = visibleCols.indexOf(activeCell.field);
    const rowIndex = activeCell.rowIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setActiveCell({ rowIndex: rowIndex - 1, field: activeCell.field });
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < displayRows.length - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, field: activeCell.field });
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          setActiveCell({ rowIndex, field: visibleCols[colIndex - 1] });
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < visibleCols.length - 1) {
          setActiveCell({ rowIndex, field: visibleCols[colIndex + 1] });
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            setActiveCell({ rowIndex, field: visibleCols[colIndex - 1] });
          } else if (rowIndex > 0) {
            setActiveCell({ rowIndex: rowIndex - 1, field: visibleCols[visibleCols.length - 1] });
          }
        } else {
          if (colIndex < visibleCols.length - 1) {
            setActiveCell({ rowIndex, field: visibleCols[colIndex + 1] });
          } else if (rowIndex < displayRows.length - 1) {
            setActiveCell({ rowIndex: rowIndex + 1, field: visibleCols[0] });
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        startEditing();
        break;

      case 'Delete':
      case 'Backspace':
        if (activeCell) {
          const targetItem = displayRows[activeCell.rowIndex];
          if (targetItem) {
            onUpdateCell(targetItem.rowId, activeCell.field, '');
          }
        }
        break;

      default:
        // Direct typing into active cell
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          startEditing(e.key);
        }
        break;
    }
  };

  const startEditing = (initialVal?: string) => {
    if (!activeCell) return;
    const item = displayRows[activeCell.rowIndex];
    if (!item) return;

    const curVal = item.row[activeCell.field];
    setEditValue(initialVal !== undefined ? initialVal : String(curVal ?? ''));
    setIsEditing(true);
  };

  const commitEditing = () => {
    if (!activeCell) return;
    const item = displayRows[activeCell.rowIndex];
    if (item) {
      onUpdateCell(item.rowId, activeCell.field, editValue);
    }
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Select all toggle
  const allSelected =
    displayRows.length > 0 &&
    displayRows.every((r) => state.selectedRowIds.has(r.rowId));

  const selectedCount = state.selectedRowIds.size;

  return (
    <div
      className="di-grid-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Editable Data Spreadsheet"
    >
      {/* Grid Toolbar */}
      <div className="di-grid-toolbar">
        <div className="di-toolbar-left">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 8, color: 'var(--di-muted)' }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              className="di-input-search"
              style={{ paddingLeft: 28 }}
              placeholder="Search data..."
              value={state.searchQuery}
              onChange={(e) => onSetSearch(e.target.value)}
              aria-label="Search spreadsheet"
            />
          </div>

          <button
            type="button"
            className={`di-btn di-btn-secondary di-btn-sm ${state.filters ? 'border-primary' : ''}`}
            onClick={() => setIsFilterModalOpen(true)}
          >
            <IconFilter size={14} />
            Filter {state.filters ? `(${state.filters.rules.length})` : ''}
          </button>

          <div style={{ height: 18, width: 1, backgroundColor: 'var(--di-border)' }} />

          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onUndo}
            disabled={!state.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <IconUndo size={14} />
          </button>

          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onRedo}
            disabled={!state.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <IconRedo size={14} />
          </button>

          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={() => onAddRow()}
            title="Add new row"
          >
            <IconPlus size={14} />
            Add Row
          </button>
        </div>

        <div className="di-toolbar-right">
          {selectedCount > 0 && (
            <>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--di-primary)' }}>
                {selectedCount} selected
              </span>

              <button
                type="button"
                className="di-btn di-btn-secondary di-btn-sm"
                onClick={() => setIsBulkEditModalOpen(true)}
              >
                Bulk Edit
              </button>

              <button
                type="button"
                className="di-btn di-btn-danger di-btn-sm"
                onClick={() => {
                  if (confirm(`Delete ${selectedCount} selected row(s)?`)) {
                    onDeleteRows(Array.from(state.selectedRowIds));
                  }
                }}
              >
                <IconTrash size={14} />
                Delete ({selectedCount})
              </button>
            </>
          )}

          <div style={{ height: 18, width: 1, backgroundColor: 'var(--di-border)' }} />

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="di-btn di-btn-secondary di-btn-sm"
              onClick={() => onExportErrors('csv')}
              disabled={state.statistics.invalid === 0 && state.statistics.warnings === 0}
              title="Export validation errors to CSV"
            >
              <IconDownload size={14} />
              Export Errors
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Tabs / Stats */}
      <div className="di-grid-stats-bar">
        <span style={{ color: 'var(--di-text-secondary)' }}>View:</span>

        <div
          className={`di-stat-item ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          <span>All Rows ({state.rows.length})</span>
        </div>

        <div
          className={`di-stat-item ${quickFilter === 'errors' ? 'active' : ''}`}
          onClick={() => setQuickFilter('errors')}
          style={{ color: state.statistics.invalid > 0 ? 'var(--di-error)' : undefined }}
        >
          <IconAlertCircle size={14} />
          <span>Errors ({state.statistics.invalid})</span>
        </div>

        <div
          className={`di-stat-item ${quickFilter === 'warnings' ? 'active' : ''}`}
          onClick={() => setQuickFilter('warnings')}
          style={{ color: state.statistics.warnings > 0 ? 'var(--di-warning)' : undefined }}
        >
          <IconAlertTriangle size={14} />
          <span>Warnings ({state.statistics.warnings})</span>
        </div>

        <div
          className={`di-stat-item ${quickFilter === 'duplicates' ? 'active' : ''}`}
          onClick={() => setQuickFilter('duplicates')}
        >
          <IconCopy size={14} />
          <span>Duplicates ({state.statistics.duplicates})</span>
        </div>
      </div>

      {/* Spreadsheet Virtual Table Viewport */}
      <div className="di-spreadsheet-viewport" ref={containerRef}>
        <table className="di-spreadsheet-table">
          <thead>
            <tr>
              <th className="di-th di-th-row-num">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectAllRows();
                    } else {
                      onClearSelection();
                    }
                  }}
                  aria-label="Select all rows"
                />
              </th>
              {schema.map((col) => {
                const sortRule = state.sorting.find((s) => s.field === col.key);
                return (
                  <th
                    key={col.key}
                    className="di-th"
                    onClick={() => handleSortClick(col.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span>
                        {col.label} {col.required && <span style={{ color: 'var(--di-error)' }}>*</span>}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--di-muted)' }}>
                        {sortRule ? (sortRule.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {topPadding > 0 && (
              <tr>
                <td colSpan={schema.length + 1} style={{ height: topPadding, padding: 0, border: 'none' }} />
              </tr>
            )}

            {visibleRows.map((item, visibleIdx) => {
              const actualRowIndex = startIndex + visibleIdx;
              const rowId = item.rowId;
              const isRowSelected = state.selectedRowIds.has(rowId);
              const rowErrorList = state.rowErrors[rowId];

              return (
                <tr key={rowId} style={{ height: ROW_HEIGHT }}>
                  <td className="di-td di-td-row-num">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => onToggleRowSelection(rowId)}
                        aria-label={`Select row ${actualRowIndex + 1}`}
                      />
                      <span>{actualRowIndex + 1}</span>
                    </div>
                  </td>

                  {schema.map((col) => {
                    const field = col.key;
                    const cellKey = `${rowId}:${field}`;
                    const cellErrors = state.errors[cellKey];
                    const cellWarnings = state.warnings[cellKey];
                    const hasError = !!(cellErrors && cellErrors.length > 0);
                    const hasWarning = !!(cellWarnings && cellWarnings.length > 0);
                    const isActive =
                      activeCell?.rowIndex === actualRowIndex && activeCell?.field === field;

                    const cellVal = item.row[field];
                    const displayVal =
                      col.display ? col.display(cellVal, item.row) : cellVal !== null && cellVal !== undefined ? String(cellVal) : '';

                    return (
                      <td
                        key={field}
                        className={`di-td ${isRowSelected ? 'selected' : ''} ${
                          isActive ? 'active' : ''
                        } ${hasError ? 'has-error' : ''} ${hasWarning ? 'has-warning' : ''}`}
                        onClick={() => {
                          setActiveCell({ rowIndex: actualRowIndex, field });
                        }}
                        onDoubleClick={() => {
                          setActiveCell({ rowIndex: actualRowIndex, field });
                          startEditing();
                        }}
                        title={
                          hasError
                            ? cellErrors.map((e) => e.message).join('\n')
                            : hasWarning
                              ? cellWarnings.map((w) => w.message).join('\n')
                              : undefined
                        }
                      >
                        {isActive && isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            className="di-cell-editor"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                commitEditing();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                          />
                        ) : (
                          <div className="di-cell-content">
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {displayVal}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {bottomPadding > 0 && (
              <tr>
                <td colSpan={schema.length + 1} style={{ height: bottomPadding, padding: 0, border: 'none' }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <FilterModal
          schema={schema}
          initialFilter={state.filters}
          onApply={onSetFilter}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <BulkEditModal
          schema={schema}
          selectedRowIds={Array.from(state.selectedRowIds)}
          onApply={(field, value) => {
            const changes = Array.from(state.selectedRowIds).map((id) => ({
              rowId: id,
              field,
              value
            }));
            onUpdateCells(changes);
          }}
          onClose={() => setIsBulkEditModalOpen(false)}
        />
      )}
    </div>
  );
};

function evaluateFilterGroup(row: Record<string, unknown>, group: FilterGroup): boolean {
  if (!group.rules || group.rules.length === 0) return true;
  if (group.condition === 'OR') {
    return group.rules.some((r) => {
      if ('condition' in r) return evaluateFilterGroup(row, r as FilterGroup);
      return evaluateRule(row, r as any);
    });
  }
  return group.rules.every((r) => {
    if ('condition' in r) return evaluateFilterGroup(row, r as FilterGroup);
    return evaluateRule(row, r as any);
  });
}

function evaluateRule(
  row: Record<string, unknown>,
  rule: { field: string; operator: string; value?: unknown }
): boolean {
  const raw = row[rule.field];
  const str = String(raw ?? '').toLowerCase();
  const target = String(rule.value ?? '').toLowerCase();
  switch (rule.operator) {
    case 'equals':
      return String(raw) === String(rule.value);
    case 'notEquals':
      return String(raw) !== String(rule.value);
    case 'contains':
      return str.includes(target);
    case 'notContains':
      return !str.includes(target);
    case 'startsWith':
      return str.startsWith(target);
    case 'endsWith':
      return str.endsWith(target);
    case 'greaterThan':
      return Number(raw) > Number(rule.value);
    case 'greaterThanOrEqual':
      return Number(raw) >= Number(rule.value);
    case 'lessThan':
      return Number(raw) < Number(rule.value);
    case 'lessThanOrEqual':
      return Number(raw) <= Number(rule.value);
    case 'isEmpty':
      return raw === null || raw === undefined || String(raw).trim() === '';
    case 'isNotEmpty':
      return raw !== null && raw !== undefined && String(raw).trim() !== '';
    default:
      return true;
  }
}
