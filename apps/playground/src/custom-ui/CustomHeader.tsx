import React from 'react';
import { PRESETS, PresetConfig } from '../presets';
import { UseDataImporterReturn } from 'data-importer/react';

export type PlaygroundMode = 'custom' | 'default' | 'shimmer';

interface CustomHeaderProps {
  api: UseDataImporterReturn;
  selectedPreset: PresetConfig;
  onSelectPreset: (preset: PresetConfig) => void;
  activeMode: PlaygroundMode;
  onSelectMode: (mode: PlaygroundMode) => void;
}

const STEPS = [
  { id: 'upload', label: '1. Upload File' },
  { id: 'sheet-select', label: '2. Select Sheet' },
  { id: 'mapping', label: '3. Map Fields' },
  { id: 'review', label: '4. Review & Edit' },
  { id: 'importing', label: '5. Ingestion' },
  { id: 'result', label: '6. Done' }
];

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  api,
  selectedPreset,
  onSelectPreset,
  activeMode,
  onSelectMode
}) => {
  const currentStep = api.state.currentStep;

  const getStepIndex = (stepId: string) => {
    return STEPS.findIndex((s) => s.id === stepId);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <header>
      {/* Top Navbar */}
      <div className="c-navbar">
        <div className="c-brand">
          <div className="c-logo-badge">PRO</div>
          <div>
            <div className="c-brand-title">Data Importer Studio</div>
            <div className="c-brand-subtitle">
              Interactive Custom UI Playground with Real-time Validation
            </div>
          </div>
        </div>

        <div className="c-nav-controls">
          {/* Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontWeight: 500 }}>
              Schema Preset:
            </span>
            <select
              value={selectedPreset.id}
              onChange={(e) => {
                const found = PRESETS.find((p) => p.id === e.target.value);
                if (found) {
                  onSelectPreset(found);
                  api.reset();
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--c-border)',
                background: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher Toggle */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--c-border)'
            }}
          >
            <button
              type="button"
              onClick={() => onSelectMode('custom')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeMode === 'custom' ? '#ffffff' : 'transparent',
                color: activeMode === 'custom' ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: activeMode === 'custom' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ 100% Custom UI
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('default')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeMode === 'default' ? '#ffffff' : 'transparent',
                color: activeMode === 'default' ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: activeMode === 'default' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📦 Default UI (Full Viewport)
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('shimmer')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeMode === 'shimmer' ? '#ffffff' : 'transparent',
                color: activeMode === 'shimmer' ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: activeMode === 'shimmer' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ✨ AutoShimmer System
            </button>
          </div>

          {/* Reset / New File Button */}
          <button
            type="button"
            className="c-btn c-btn-secondary"
            onClick={api.reset}
            style={{ padding: '6px 14px', fontSize: 13 }}
            title="Reset importer to initial state"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Stepper Bar (visible in custom UI mode) */}
      {activeMode === 'custom' && (
        <div className="c-stepper-container">
          <div className="c-stepper">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isPast = idx < currentIndex;
              const canClick = isPast && step.id !== 'importing';

              // Hide sheet select step if file has only 1 sheet or not excel
              if (step.id === 'sheet-select' && api.state.sheets.length <= 1) {
                return null;
              }

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`c-step-item ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}
                    onClick={() => {
                      if (canClick) {
                        api.setStep(step.id as any);
                      }
                    }}
                    style={{ cursor: canClick ? 'pointer' : 'default' }}
                  >
                    <div className="c-step-circle">
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: 13 }}>{step.label}</span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`c-step-line ${isPast ? 'completed' : ''}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
