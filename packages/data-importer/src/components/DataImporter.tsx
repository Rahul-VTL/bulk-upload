import React, { useMemo } from 'react';
import {
  ImporterOptions,
  ImporterSchema,
  ThemeConfig,
  ComponentOverrides,
  ImportResult,
  ImportRowResult,
  ImportProgress
} from '../types';
import { useDataImporter } from '../hooks/useDataImporter';
import { Header } from './common/Header';
import { UploadZone } from './upload/UploadZone';
import { SheetSelector } from './sheets/SheetSelector';
import { MappingPanel } from './mapping/MappingPanel';
import { DataGrid } from './grid/DataGrid';
import { ImportSummary } from './summary/ImportSummary';
import { ResultView } from './result/ResultView';

export interface DataImporterProps {
  schema: ImporterSchema;
  acceptedFiles?: ('csv' | 'tsv' | 'xls' | 'xlsx' | string)[];
  maxFileSize?: number;
  allowImportWithErrors?: boolean;
  allowImportWithWarnings?: boolean;
  theme?: ThemeConfig;
  components?: ComponentOverrides;
  checkDuplicate?: (row: Record<string, unknown>) => boolean | Promise<boolean>;
  onImport?: (
    rows: Record<string, unknown>[],
    progressCallback: (progress: ImportProgress) => void
  ) => Promise<ImportResult | ImportRowResult[] | void>;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const DataImporter: React.FC<DataImporterProps> = ({
  schema,
  acceptedFiles = ['csv', 'tsv', 'xls', 'xlsx'],
  maxFileSize = 50 * 1024 * 1024,
  allowImportWithErrors = false,
  allowImportWithWarnings = true,
  theme,
  components = {},
  checkDuplicate,
  onImport,
  onComplete,
  onCancel,
  className = '',
  style
}) => {
  const importerApi = useDataImporter({
    schema,
    acceptedFiles,
    maxFileSize,
    allowImportWithErrors,
    allowImportWithWarnings,
    checkDuplicate,
    onImport,
    onComplete,
    onCancel
  });

  const { state } = importerApi;

  // Compute CSS custom properties from theme object
  const themeStyles = useMemo<React.CSSProperties>(() => {
    if (!theme) return {};
    const cssVars: Record<string, string> = {};

    if (theme.primary) cssVars['--di-primary'] = theme.primary;
    if (theme.primaryHover) cssVars['--di-primary-hover'] = theme.primaryHover;
    if (theme.background) cssVars['--di-background'] = theme.background;
    if (theme.surface) cssVars['--di-surface'] = theme.surface;
    if (theme.surfaceSecondary) cssVars['--di-surface-secondary'] = theme.surfaceSecondary;
    if (theme.border) cssVars['--di-border'] = theme.border;
    if (theme.text) cssVars['--di-text'] = theme.text;
    if (theme.textSecondary) cssVars['--di-text-secondary'] = theme.textSecondary;
    if (theme.muted) cssVars['--di-muted'] = theme.muted;
    if (theme.success) cssVars['--di-success'] = theme.success;
    if (theme.warning) cssVars['--di-warning'] = theme.warning;
    if (theme.error) cssVars['--di-error'] = theme.error;
    if (theme.focus) cssVars['--di-focus'] = theme.focus;
    if (theme.radiusSm) cssVars['--di-radius-sm'] = theme.radiusSm;
    if (theme.radiusMd) cssVars['--di-radius-md'] = theme.radiusMd;
    if (theme.radiusLg) cssVars['--di-radius-lg'] = theme.radiusLg;
    if (theme.fontFamily) cssVars['--di-font-family'] = theme.fontFamily;

    return cssVars as React.CSSProperties;
  }, [theme]);

  // Component Overrides
  const HeaderComponent = components.Header || Header;
  const UploadZoneComponent = components.UploadZone || UploadZone;
  const MappingPanelComponent = components.MappingPanel || MappingPanel;
  const GridComponent = components.Grid || DataGrid;
  const ResultViewComponent = components.ResultView || ResultView;

  return (
    <div
      className={`di-container ${className}`}
      style={{ ...themeStyles, ...style }}
      data-testid="data-importer-container"
    >
      <HeaderComponent state={state} onReset={importerApi.reset} />

      <main className="di-content">
        {state.currentStep === 'upload' && (
          <UploadZoneComponent
            acceptedFiles={acceptedFiles}
            maxFileSize={maxFileSize}
            isLoading={state.isLoading}
            loadingMessage={state.loadingMessage}
            onFileSelect={(file) => {
              importerApi.loadFile(file).catch((err) => {
                console.error('File load error:', err);
              });
            }}
          />
        )}

        {state.currentStep === 'sheet-select' && (
          <SheetSelector
            sheets={state.sheets}
            selectedSheetId={state.selectedSheetId}
            isLoading={state.isLoading}
            onSelectSheet={(sheetId) => {
              importerApi.selectSheet(sheetId);
            }}
          />
        )}

        {state.currentStep === 'mapping' && (
          <MappingPanelComponent
            mappings={state.mappings}
            schema={schema}
            isLoading={state.isLoading}
            onUpdateMapping={importerApi.setMapping}
            onAutoMap={importerApi.autoMap}
            onConfirm={importerApi.confirmMappingAndPrepare}
          />
        )}

        {state.currentStep === 'review' && (
          <>
            <GridComponent
              state={state}
              schema={schema}
              onUpdateCell={importerApi.updateCell}
              onUpdateCells={importerApi.updateCells}
              onAddRow={importerApi.addRow}
              onDeleteRows={importerApi.deleteRows}
              onDuplicateRow={importerApi.duplicateRow}
              onUndo={importerApi.undo}
              onRedo={importerApi.redo}
              onSetFilter={importerApi.setFilter}
              onSetSearch={importerApi.setSearch}
              onSetSorting={importerApi.setSorting}
              onToggleRowSelection={importerApi.toggleRowSelection}
              onSelectAllRows={importerApi.selectAllRows}
              onClearSelection={importerApi.clearSelection}
              onExportErrors={importerApi.exportErrors}
              onValidate={importerApi.validate}
            />

            <footer className="di-footer">
              <div style={{ fontSize: 13, color: 'var(--di-text-secondary)' }}>
                <span>Total records: <strong>{state.rows.length}</strong></span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>Valid: <strong style={{ color: 'var(--di-success)' }}>{state.statistics.valid}</strong></span>
                {state.statistics.invalid > 0 && (
                  <>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>Errors: <strong style={{ color: 'var(--di-error)' }}>{state.statistics.invalid}</strong></span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="di-btn di-btn-primary"
                  onClick={() => {
                    importerApi.import().catch((err) => {
                      console.error('Import error:', err);
                    });
                  }}
                  disabled={state.statistics.invalid > 0 && !allowImportWithErrors}
                >
                  Import {state.rows.length} Records
                </button>
              </div>
            </footer>
          </>
        )}

        {state.currentStep === 'importing' && (
          <ImportSummary
            statistics={state.statistics}
            progress={state.progress}
            isLoading={state.isLoading}
            allowImportWithErrors={allowImportWithErrors}
            allowImportWithWarnings={allowImportWithWarnings}
            onProceed={() => {
              importerApi.import();
            }}
            onBack={() => {
              // Return to grid
            }}
          />
        )}

        {state.currentStep === 'result' && state.result && (
          <ResultViewComponent
            result={state.result}
            onReset={importerApi.reset}
            onClose={onCancel}
          />
        )}
      </main>
    </div>
  );
};
