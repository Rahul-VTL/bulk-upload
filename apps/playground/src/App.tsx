import React, { useState } from 'react';
import { useDataImporter, DataImporter, ImportProgress, ImportResult } from 'data-importer/react';
import './custom-ui/custom-styles.css';
import { PRESETS, PresetConfig } from './presets';
import { CustomHeader } from './custom-ui/CustomHeader';
import { CustomUploadStep } from './custom-ui/CustomUploadStep';
import { CustomSheetStep } from './custom-ui/CustomSheetStep';
import { CustomMappingStep } from './custom-ui/CustomMappingStep';
import { CustomReviewStep } from './custom-ui/CustomReviewStep';
import { CustomImportingStep } from './custom-ui/CustomImportingStep';
import { CustomResultStep } from './custom-ui/CustomResultStep';

export const App: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetConfig>(PRESETS[0]);
  const [isCustomUIMode, setIsCustomUIMode] = useState<boolean>(true);

  // Simulated backend API import handler
  const handleImport = async (
    rows: Record<string, unknown>[],
    onProgress: (p: ImportProgress) => void
  ): Promise<ImportResult> => {
    const startTime = performance.now();
    console.log(`[API Import] Sending ${rows.length} records to backend:`, rows);

    // Simulate batch progress
    const total = rows.length;
    for (let i = 1; i <= total; i++) {
      await new Promise((r) => setTimeout(r, Math.max(15, Math.floor(400 / total))));
      onProgress({
        processed: i,
        total,
        percentage: Math.round((i / total) * 100),
        successCount: i,
        failureCount: 0
      });
    }

    const duration = Math.round(performance.now() - startTime);

    return {
      totalRows: total,
      validRows: total,
      invalidRows: 0,
      warningRows: 0,
      importedRows: total,
      failedRows: 0,
      duration,
      errors: []
    };
  };

  // 100% Headless hook powering the custom UI
  const customImporterApi = useDataImporter({
    schema: selectedPreset.schema,
    onImport: handleImport
  });

  const { currentStep } = customImporterApi.state;

  return (
    <div className="custom-ui-app">
      {/* Universal Header with Preset Switcher & Mode Switcher */}
      <CustomHeader
        api={customImporterApi}
        selectedPreset={selectedPreset}
        onSelectPreset={setSelectedPreset}
        isCustomUIMode={isCustomUIMode}
        onToggleCustomUIMode={setIsCustomUIMode}
      />

      <main className="c-main-layout">
        {isCustomUIMode ? (
          /* ============================================================ */
          /* ⚡ 100% COMPLETELY CUSTOM UI (Every Step Built from Scratch) */
          /* ============================================================ */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {currentStep === 'upload' && (
              <CustomUploadStep
                api={customImporterApi}
                preset={selectedPreset}
              />
            )}

            {currentStep === 'sheet-select' && (
              <CustomSheetStep api={customImporterApi} />
            )}

            {currentStep === 'mapping' && (
              <CustomMappingStep
                api={customImporterApi}
                preset={selectedPreset}
              />
            )}

            {currentStep === 'review' && (
              <CustomReviewStep
                api={customImporterApi}
                preset={selectedPreset}
              />
            )}

            {currentStep === 'importing' && (
              <CustomImportingStep api={customImporterApi} />
            )}

            {currentStep === 'result' && (
              <CustomResultStep api={customImporterApi} />
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* 📦 DEFAULT PACKAGE UI (Comparison View)                      */
          /* ============================================================ */
          <div
            style={{
              flex: 1,
              height: '75vh',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid var(--c-border)',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <DataImporter
              key={selectedPreset.id}
              schema={selectedPreset.schema}
              onImport={handleImport}
              onCancel={customImporterApi.reset}
            />
          </div>
        )}
      </main>
    </div>
  );
};
