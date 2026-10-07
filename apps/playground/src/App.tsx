import React, { useState } from 'react';
import { useDataImporter, DataImporter, ImportProgress, ImportResult } from 'data-importer/react';
import './custom-ui/custom-styles.css';
import { PRESETS, PresetConfig } from './presets';
import { CustomHeader, PlaygroundMode } from './custom-ui/CustomHeader';
import { CustomUploadStep } from './custom-ui/CustomUploadStep';
import { CustomSheetStep } from './custom-ui/CustomSheetStep';
import { CustomMappingStep } from './custom-ui/CustomMappingStep';
import { CustomReviewStep } from './custom-ui/CustomReviewStep';
import { CustomImportingStep } from './custom-ui/CustomImportingStep';
import { CustomResultStep } from './custom-ui/CustomResultStep';
import { AutoShimmerDemo } from './components/AutoShimmerDemo';
import { ModalDemoView } from './components/ModalDemoView';
import { DocsGuide } from './components/DocsGuide';

export const App: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetConfig>(PRESETS[0]);
  const [activeMode, setActiveMode] = useState<PlaygroundMode>('custom');
  const [isFullScreenDefault, setIsFullScreenDefault] = useState<boolean>(false);

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

  if (activeMode === 'default' && isFullScreenDefault) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setIsFullScreenDefault(false)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
        >
          ✕ Exit Full Viewport Mode
        </button>
        <DataImporter
          key={selectedPreset.id}
          schema={selectedPreset.schema}
          onImport={handleImport}
          onCancel={() => {
            customImporterApi.reset();
            setIsFullScreenDefault(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="custom-ui-app">
      {/* Universal Header with Preset Switcher & Mode Switcher */}
      <CustomHeader
        api={customImporterApi}
        selectedPreset={selectedPreset}
        onSelectPreset={setSelectedPreset}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
      />

      <main className="c-main-layout" style={{ padding: activeMode === 'default' ? 0 : undefined }}>
        {activeMode === 'custom' && (
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
        )}

        {activeMode === 'modal' && (
          /* ============================================================ */
          /* 🪟 PRE-BUILT MODAL DIALOG MODE (Button Popup Trigger)        */
          /* ============================================================ */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ModalDemoView
              selectedPreset={selectedPreset}
              handleImport={handleImport}
            />
          </div>
        )}

        {activeMode === 'default' && (
          /* ============================================================ */
          /* 📦 DEFAULT PACKAGE UI (Exact Viewport Height/Width Sizing)  */
          /* ============================================================ */
          <div
            style={{
              flex: 1,
              width: '100%',
              height: 'calc(100vh - 65px)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 180,
                zIndex: 40
              }}
            >
              <button
                type="button"
                onClick={() => setIsFullScreenDefault(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="Expand to complete 100vw x 100vh browser viewport"
              >
                ⤢ Full Viewport (100vw × 100vh)
              </button>
            </div>

            <DataImporter
              key={selectedPreset.id}
              schema={selectedPreset.schema}
              chunkSize={50}
              onImport={handleImport}
              onCancel={customImporterApi.reset}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {activeMode === 'shimmer' && (
          /* ============================================================ */
          /* ✨ AUTOSHIMMER SYSTEM SHOWCASE                               */
          /* ============================================================ */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AutoShimmerDemo />
          </div>
        )}

        {activeMode === 'docs' && (
          /* ============================================================ */
          /* 📖 CODE INTEGRATION & DEVELOPER GUIDE                        */
          /* ============================================================ */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <DocsGuide />
          </div>
        )}
      </main>
    </div>
  );
};
