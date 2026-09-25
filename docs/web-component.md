# Web Component Integration

Data Importer provides a standard Custom Element `<generic-data-importer>` allowing usage in Vanilla JavaScript, Angular, Vue, Svelte, or server-rendered HTML applications.

## HTML Usage

```html
<generic-data-importer
  id="importer"
  accepted-files="csv,xlsx"
  max-file-size="52428800"
></generic-data-importer>

<script type="module">
  import { GenericDataImporterElement } from 'data-importer';

  const importer = document.getElementById('importer');
  importer.schema = [
    { key: 'name', label: 'Name', type: 'string', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true }
  ];

  importer.options = {
    onImport: async (rows) => {
      console.log('Ingesting rows:', rows);
    }
  };

  importer.addEventListener('import', (event) => {
    console.log('Import completed:', event.detail);
  });
</script>
```
