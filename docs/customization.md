# Component Overrides & Customization

Every stage of the UI workflow can be customized or completely replaced using component overrides, step render props, or headless children.

---

## 1. Component Overrides

You can replace any individual component of the importer while keeping the rest default:

```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  components={{
    Header: CustomHeader,
    UploadZone: CustomUploadZone,
    SheetSelector: CustomSheetSelector,
    MappingPanel: CustomMappingPanel,
    Grid: CustomGrid,
    Footer: CustomFooter,
    Summary: CustomSummary,
    ResultView: CustomResultView
  }}
/>
```

### Supported Component Overrides
| Override Key | Description | Props Received |
|---|---|---|
| `Header` | Top title bar and reset action | `{ state, onReset }` |
| `UploadZone` | Drop zone / file picker | `{ acceptedFiles, maxFileSize, isLoading, loadingMessage, onFileSelect }` |
| `SheetSelector` | Workbook sheet selection screen | `{ sheets, selectedSheetId, isLoading, onSelectSheet }` |
| `MappingPanel` | Column matching screen | `{ mappings, schema, isLoading, onUpdateMapping, onAutoMap, onConfirm }` |
| `Grid` | Spreadsheet data editor | `{ state, schema, onUpdateCell, onUpdateCells, onAddRow, onDeleteRows, ... }` |
| `Footer` | Bottom actions bar (records summary & import trigger) | `{ state, allowImportWithErrors, onImport }` |
| `Summary` / `ImportSummary` | Pre-import diagnostics and progress bar | `{ statistics, progress, isLoading, allowImportWithErrors, onProceed, onBack }` |
| `ResultView` | Final success/completion screen | `{ result, onReset, onClose }` |

---

## 2. Step Render Props

For quick inline customizations without declaring separate component definitions:

```tsx
<DataImporter
  schema={schema}
  onImport={handleImport}
  renderHeader={(api) => (
    <div className="my-header">
      <h2>Custom Uploader</h2>
      <button onClick={api.reset}>Start Over</button>
    </div>
  )}
  renderUpload={(api) => (
    <div className="my-upload-box">
      <input type="file" onChange={(e) => e.target.files?.[0] && api.loadFile(e.target.files[0])} />
    </div>
  )}
  renderFooter={(api) => (
    <div className="my-footer">
      <span>{api.state.rows.length} total rows</span>
      <button onClick={() => api.import()}>Upload to Cloud</button>
    </div>
  )}
/>
```

Supported render props:
- `renderHeader(api)`
- `renderUpload(api)`
- `renderSheetSelect(api)`
- `renderMapping(api)`
- `renderReview(api)`
- `renderFooter(api)`
- `renderSummary(api)`
- `renderResult(api)`

---

## 3. Render Props via `children` (Headless Component Mode)

Pass a function as children to completely control the rendered UI within `<DataImporter>`:

```tsx
<DataImporter schema={schema} onImport={handleImport}>
  {(importer) => (
    <div className="my-custom-wrapper">
      {importer.state.currentStep === 'upload' && (
        <button onClick={() => selectFileAndUpload(importer.loadFile)}>
          Upload CSV / Excel
        </button>
      )}

      {importer.state.currentStep === 'review' && (
        <div>
          <h3>Review Data ({importer.state.statistics.valid} valid records)</h3>
          <button onClick={() => importer.import()}>Submit to Backend</button>
        </div>
      )}
    </div>
  )}
</DataImporter>
```

---

## 4. Compound Components via Context

If you have a complex layout with deeply nested components:

```tsx
import { DataImporterProvider, useDataImporterContext } from 'data-importer/react';

function CustomControls() {
  const { state, undo, redo, import: runImport } = useDataImporterContext();
  return (
    <div>
      <button disabled={!state.canUndo} onClick={undo}>Undo</button>
      <button disabled={!state.canRedo} onClick={redo}>Redo</button>
      <button onClick={() => runImport()}>Finish Import</button>
    </div>
  );
}

export function App() {
  return (
    <DataImporterProvider schema={schema} onImport={handleImport}>
      <CustomHeader />
      <CustomGrid />
      <CustomControls />
    </DataImporterProvider>
  );
}
```
