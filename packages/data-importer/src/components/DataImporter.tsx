import React, { useMemo } from 'react';
import {
  ImporterSchema,
  ThemeConfig,
  ComponentOverrides,
  ImportResult,
  ImportRowResult,
  ImportProgress
} from '../types';
import { useDataImporter, UseDataImporterReturn } from '../hooks/useDataImporter';
import { DataImporterContext } from '../context/DataImporterContext';
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
  chunkSize?: number;
  onUploadChunk?: (chunkRows: Record<string, unknown>[], meta: any) => Promise<any>;
  onImport?: (
    rows: Record<string, unknown>[],
    progressCallback: (progress: ImportProgress) => void
  ) => Promise<ImportResult | ImportRowResult[] | void>;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
  onBackToListing?: () => void;
  backToListingLabel?: string;
  onDownloadInvalidRows?: (format?: 'csv' | 'xlsx') => void;
  initialFile?: File | null;
  className?: string;
  style?: React.CSSProperties;

  // Custom UI slots & render props:
  children?: React.ReactNode | ((api: UseDataImporterReturn) => React.ReactNode);
  renderHeader?: (api: UseDataImporterReturn) => React.ReactNode;
  renderUpload?: (api: UseDataImporterReturn) => React.ReactNode;
  renderSheetSelect?: (api: UseDataImporterReturn) => React.ReactNode;
  renderMapping?: (api: UseDataImporterReturn) => React.ReactNode;
  renderReview?: (api: UseDataImporterReturn) => React.ReactNode;
  renderFooter?: (api: UseDataImporterReturn) => React.ReactNode;
  renderSummary?: (api: UseDataImporterReturn) => React.ReactNode;
  renderResult?: (api: UseDataImporterReturn) => React.ReactNode;
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
  chunkSize,
  onUploadChunk,
  onImport,
  onComplete,
  onCancel,
  onBackToListing,
  backToListingLabel = 'Back to Listing',
  onDownloadInvalidRows,
  initialFile,
  className = '',
  style,
  children,
  renderHeader,
  renderUpload,
  renderSheetSelect,
  renderMapping,
  renderReview,
  renderFooter,
  renderSummary,
  renderResult
}) => {
  const importerApi = useDataImporter({
    schema,
    acceptedFiles,
    maxFileSize,
    allowImportWithErrors,
    allowImportWithWarnings,
    checkDuplicate,
    chunkSize,
    onUploadChunk,
    onImport,
    onComplete,
    onCancel
  });

  const { state } = importerApi;

  React.useEffect(() => {
    if (initialFile) {
      importerApi.loadFile(initialFile).catch((err) => {
        console.error('Failed to load initial file:', err);
      });
    }
  }, [initialFile]);

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

  // If consumer supplied children, render headless / custom UI within context
  if (children) {
    return (
      <DataImporterContext.Provider value={importerApi}>
        <div
          className={`di-container ${className}`}
          style={{ ...themeStyles, ...style }}
          data-testid="data-importer-container"
        >
          {typeof children === 'function' ? children(importerApi) : children}
        </div>
      </DataImporterContext.Provider>
    );
  }

  // Component Overrides
  const HeaderComponent = components.Header || Header;
  const UploadZoneComponent = components.UploadZone || UploadZone;
  const SheetSelectorComponent = components.SheetSelector || SheetSelector;
  const MappingPanelComponent = components.MappingPanel || MappingPanel;
  const GridComponent = components.Grid || DataGrid;
  const FooterComponent = components.Footer;
  const SummaryComponent = components.Summary || components.ImportSummary || ImportSummary;
  const ResultViewComponent = components.ResultView || ResultView;

  return (
    <DataImporterContext.Provider value={importerApi}>
      <div
        className={`di-container ${className}`}
        style={{ ...themeStyles, ...style }}
        data-testid="data-importer-container"
      >
        {renderHeader ? (
          renderHeader(importerApi)
        ) : (
          <HeaderComponent
            state={state}
            onReset={importerApi.reset}
            onStepClick={importerApi.setStep}
          />
        )}

        <main className="di-content">
          {state.currentStep === 'upload' && (
            renderUpload ? (
              renderUpload(importerApi)
            ) : (
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
            )
          )}

          {state.currentStep === 'sheet-select' && (
            renderSheetSelect ? (
              renderSheetSelect(importerApi)
            ) : (
              <SheetSelectorComponent
                sheets={state.sheets}
                selectedSheetId={state.selectedSheetId}
                isLoading={state.isLoading}
                onSelectSheet={(sheetId) => {
                  importerApi.selectSheet(sheetId);
                }}
              />
            )
          )}

          {state.currentStep === 'mapping' && (
            renderMapping ? (
              renderMapping(importerApi)
            ) : (
              <MappingPanelComponent
                mappings={state.mappings}
                schema={schema}
                isLoading={state.isLoading}
                onUpdateMapping={importerApi.setMapping}
                onAutoMap={importerApi.autoMap}
                onConfirm={importerApi.confirmMappingAndPrepare}
                onBack={() => {
                  if (state.sheets.length > 1) {
                    importerApi.setStep('sheet-select');
                  } else {
                    importerApi.setStep('upload');
                  }
                }}
              />
            )
          )}

          {state.currentStep === 'review' && (
            renderReview ? (
              renderReview(importerApi)
            ) : (
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

                {renderFooter ? (
                  renderFooter(importerApi)
                ) : FooterComponent ? (
                  <FooterComponent
                    state={state}
                    allowImportWithErrors={allowImportWithErrors}
                    onImport={() => {
                      importerApi.import().catch((err) => {
                        console.error('Import error:', err);
                      });
                    }}
                    onBack={() => importerApi.setStep('mapping')}
                  />
                ) : (
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

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="di-btn di-btn-secondary"
                        onClick={() => importerApi.setStep('mapping')}
                        title="Back to column mapping"
                      >
                        ← Back to Column Mapping
                      </button>

                      {/* If there are invalid rows AND there are valid rows, allow importing ONLY the valid rows! */}
                      {state.statistics.invalid > 0 && state.statistics.valid > 0 && (
                        <button
                          type="button"
                          className="di-btn di-btn-primary"
                          onClick={() => {
                            importerApi.import({ onlyValid: true }).catch((err) => {
                              console.error('Import valid only error:', err);
                            });
                          }}
                          title="Import only records that passed validation"
                        >
                          Import Valid Only ({state.statistics.valid} Records)
                        </button>
                      )}

                      {/* Import All button */}
                      {(state.statistics.invalid === 0 || allowImportWithErrors) && (
                        <button
                          type="button"
                          className={state.statistics.invalid > 0 ? 'di-btn di-btn-secondary' : 'di-btn di-btn-primary'}
                          onClick={() => {
                            importerApi.import().catch((err) => {
                              console.error('Import error:', err);
                            });
                          }}
                          disabled={state.rows.length === 0 || (state.statistics.invalid > 0 && !allowImportWithErrors)}
                        >
                          Import All ({state.rows.length} Records)
                        </button>
                      )}

                      {state.statistics.valid === 0 && state.statistics.invalid > 0 && !allowImportWithErrors && (
                        <button
                          type="button"
                          className="di-btn di-btn-primary"
                          disabled={true}
                        >
                          No Valid Records to Import
                        </button>
                      )}
                    </div>
                  </footer>
                )}
              </>
            )
          )}

          {state.currentStep === 'importing' && (
            renderSummary ? (
              renderSummary(importerApi)
            ) : (
              <SummaryComponent
                statistics={state.statistics}
                progress={state.progress}
                isLoading={state.isLoading}
                allowImportWithErrors={allowImportWithErrors}
                allowImportWithWarnings={allowImportWithWarnings}
                onProceed={() => {
                  importerApi.import();
                }}
                onProceedValidOnly={() => {
                  importerApi.import({ onlyValid: true });
                }}
                onBack={() => {
                  importerApi.setStep('review');
                }}
              />
            )
          )}

          {state.currentStep === 'result' && state.result && (
            renderResult ? (
              renderResult(importerApi)
            ) : (
              <ResultViewComponent
                result={state.result}
                onReset={importerApi.reset}
                onClose={onCancel}
                onBackToListing={onBackToListing || onCancel}
                onDownloadInvalidRows={onDownloadInvalidRows || (() => importerApi.downloadInvalidRows('csv'))}
                backToListingLabel={backToListingLabel}
                invalidCount={state.statistics.invalid}
              />
            )
          )}
        </main>
      </div>
    </DataImporterContext.Provider>
  );
};
