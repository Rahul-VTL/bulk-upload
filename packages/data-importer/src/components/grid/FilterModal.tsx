import React, { useState } from 'react';
import { FilterGroup, FilterOperator, FilterRule, ImporterSchema } from '../../types';
import { IconPlus, IconTrash, IconX } from '../common/Icons';

export interface FilterModalProps {
  schema: ImporterSchema;
  initialFilter: FilterGroup | null;
  onApply: (filter: FilterGroup | null) => void;
  onClose: () => void;
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  notEquals: 'Does not equal',
  contains: 'Contains',
  notContains: 'Does not contain',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  greaterThan: 'Greater than',
  greaterThanOrEqual: 'Greater than or equal',
  lessThan: 'Less than',
  lessThanOrEqual: 'Less than or equal',
  isEmpty: 'Is empty',
  isNotEmpty: 'Is not empty'
};

export const FilterModal: React.FC<FilterModalProps> = ({
  schema,
  initialFilter,
  onApply,
  onClose
}) => {
  const [condition, setCondition] = useState<'AND' | 'OR'>(
    initialFilter ? initialFilter.condition : 'AND'
  );

  const [rules, setRules] = useState<FilterRule[]>(() => {
    if (initialFilter && initialFilter.rules.length > 0) {
      return initialFilter.rules.filter((r): r is FilterRule => 'operator' in r);
    }
    return [
      {
        field: schema[0]?.key || '',
        operator: 'contains',
        value: ''
      }
    ];
  });

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        field: schema[0]?.key || '',
        operator: 'contains',
        value: ''
      }
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<FilterRule>) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const handleApply = () => {
    const validRules = rules.filter((r) => {
      if (r.operator === 'isEmpty' || r.operator === 'isNotEmpty') return true;
      return r.value !== undefined && r.value !== '';
    });

    if (validRules.length === 0) {
      onApply(null);
    } else {
      onApply({
        condition,
        rules: validRules
      });
    }
    onClose();
  };

  const handleClear = () => {
    onApply(null);
    onClose();
  };

  return (
    <div className="di-modal-backdrop" onClick={onClose}>
      <div
        className="di-modal-dialog"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
      >
        <div className="di-modal-header">
          <h3 id="filter-modal-title" className="di-modal-title">
            Filter Spreadsheet Rows
          </h3>
          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="di-modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--di-text-secondary)' }}>
              Match:
            </span>
            <select
              className="di-mapping-select"
              style={{ minWidth: 140 }}
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'AND' | 'OR')}
            >
              <option value="AND">All conditions (AND)</option>
              <option value="OR">Any condition (OR)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map((rule, idx) => {
              const noValueNeeded =
                rule.operator === 'isEmpty' || rule.operator === 'isNotEmpty';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 8,
                    borderRadius: 'var(--di-radius-sm)',
                    backgroundColor: 'var(--di-surface-secondary)'
                  }}
                >
                  <select
                    className="di-mapping-select"
                    style={{ minWidth: 130, flex: 1 }}
                    value={rule.field}
                    onChange={(e) => updateRule(idx, { field: e.target.value })}
                  >
                    {schema.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="di-mapping-select"
                    style={{ minWidth: 140, flex: 1 }}
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(idx, { operator: e.target.value as FilterOperator })
                    }
                  >
                    {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                      <option key={op} value={op}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {!noValueNeeded && (
                    <input
                      type="text"
                      className="di-input-search"
                      style={{ width: 'auto', flex: 1.5, backgroundColor: 'var(--di-surface)' }}
                      placeholder="Value..."
                      value={String(rule.value ?? '')}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                    />
                  )}

                  <button
                    type="button"
                    className="di-btn di-btn-secondary di-btn-sm"
                    onClick={() => removeRule(idx)}
                    title="Remove rule"
                    disabled={rules.length === 1 && idx === 0}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="di-btn di-btn-secondary di-btn-sm"
              onClick={addRule}
            >
              <IconPlus size={14} />
              Add Condition
            </button>
          </div>
        </div>

        <div className="di-modal-footer">
          <button type="button" className="di-btn di-btn-secondary" onClick={handleClear}>
            Clear Filters
          </button>
          <button type="button" className="di-btn di-btn-primary" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
