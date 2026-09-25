import React from 'react';
import { ImporterState, StepState } from '../../types';
import { IconCheck } from './Icons';

export interface HeaderProps {
  state: ImporterState;
  onReset: () => void;
}

const STEP_ORDER: { step: StepState; label: string }[] = [
  { step: 'upload', label: 'Upload' },
  { step: 'sheet-select', label: 'Sheets' },
  { step: 'mapping', label: 'Map Columns' },
  { step: 'review', label: 'Review & Edit' },
  { step: 'importing', label: 'Import' },
  { step: 'result', label: 'Complete' }
];

export const Header: React.FC<HeaderProps> = ({ state, onReset }) => {
  const currentStep = state.currentStep;
  const isMultiSheet = state.sheets.length > 1;

  // Filter out sheet-select if only 1 sheet
  const visibleSteps = STEP_ORDER.filter(
    (s) => s.step !== 'sheet-select' || isMultiSheet
  );

  const currentIndex = visibleSteps.findIndex((s) => s.step === currentStep);

  return (
    <header className="di-header" role="banner">
      <div className="di-stepper" aria-label="Import Progress">
        {visibleSteps.map((s, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = s.step === currentStep;

          return (
            <React.Fragment key={s.step}>
              <div
                className={`di-step-item ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="di-step-circle">
                  {isCompleted ? <IconCheck size={14} /> : idx + 1}
                </div>
                <span>{s.label}</span>
              </div>
              {idx < visibleSteps.length - 1 && <div className="di-step-divider" />}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {state.fileName && (
          <span style={{ fontSize: 13, color: 'var(--di-text-secondary)', fontWeight: 500 }}>
            {state.fileName}
          </span>
        )}
        {currentStep !== 'upload' && (
          <button
            type="button"
            className="di-btn di-btn-secondary di-btn-sm"
            onClick={onReset}
            title="Reset importer"
          >
            Reset
          </button>
        )}
      </div>
    </header>
  );
};
