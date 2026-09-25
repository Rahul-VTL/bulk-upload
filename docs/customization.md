# Component Overrides & Customization

Every stage of the UI workflow can be customized or completely replaced using component overrides.

## Component Overrides Property

```tsx
<DataImporter
  schema={schema}
  components={{
    Header: CustomHeader,
    UploadZone: CustomUploadZone,
    MappingPanel: CustomMappingPanel,
    Grid: CustomGrid,
    ErrorPanel: CustomErrorPanel,
    ResultView: CustomResultView
  }}
/>
```

## Example: Custom Result View

```tsx
import React from 'react';
import { ResultViewProps } from 'data-importer/react';

export const CustomResultView: React.FC<ResultViewProps> = ({ result, onReset, onClose }) => {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2>Bulk Ingestion Complete!</h2>
      <p>Successfully processed {result.importedRows} of {result.totalRows} items.</p>
      <button onClick={onReset} className="btn-primary">
        Upload More
      </button>
      {onClose && (
        <button onClick={onClose} className="btn-secondary">
          Close Importer
        </button>
      )}
    </div>
  );
};
```
