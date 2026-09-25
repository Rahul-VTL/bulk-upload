import { createImporter } from '../core/importer/create-importer';
import { DataImporterCore } from '../core/importer/data-importer';
import { ImporterOptions, ImporterSchema } from '../types';

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as typeof HTMLElement);

export class GenericDataImporterElement extends BaseElement {
  private _schema: ImporterSchema = [];
  private _options: Partial<ImporterOptions> = {};
  private importer: DataImporterCore | null = null;

  static get observedAttributes() {
    return ['accepted-files', 'max-file-size'];
  }

  connectedCallback() {
    this.initImporter();
  }

  disconnectedCallback() {
    if (this.importer) {
      this.importer.destroy();
      this.importer = null;
    }
  }

  get schema(): ImporterSchema {
    return this._schema;
  }

  set schema(val: ImporterSchema) {
    this._schema = val;
    this.initImporter();
  }

  get options(): Partial<ImporterOptions> {
    return this._options;
  }

  set options(val: Partial<ImporterOptions>) {
    this._options = val;
    this.initImporter();
  }

  private initImporter() {
    if (!this._schema || this._schema.length === 0) return;

    if (this.importer) {
      this.importer.destroy();
    }

    this.importer = createImporter({
      schema: this._schema,
      acceptedFiles: this.getAttribute('accepted-files')?.split(',') || this._options.acceptedFiles,
      maxFileSize: Number(this.getAttribute('max-file-size')) || this._options.maxFileSize,
      ...this._options
    });

    // Relay core events to DOM CustomEvents
    this.importer.on('fileParsed', (data) => {
      this.dispatchEvent(new CustomEvent('file-loaded', { detail: data }));
    });

    this.importer.on('mappingCompleted', (data) => {
      this.dispatchEvent(new CustomEvent('mapping-complete', { detail: data }));
    });

    this.importer.on('validationCompleted', (data) => {
      this.dispatchEvent(new CustomEvent('validation-complete', { detail: data }));
    });

    this.importer.on('importCompleted', (data) => {
      this.dispatchEvent(new CustomEvent('import', { detail: data }));
    });

    this.importer.on('importFailed', (data) => {
      this.dispatchEvent(new CustomEvent('error', { detail: data }));
    });
  }

  public getCore(): DataImporterCore | null {
    return this.importer;
  }
}

// Register custom element if in browser environment
if (typeof window !== 'undefined' && !customElements.get('generic-data-importer')) {
  customElements.define('generic-data-importer', GenericDataImporterElement);
}
