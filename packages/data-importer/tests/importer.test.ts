import { describe, it, expect, vi } from 'vitest';
import {
  FileValidator,
  CsvParser,
  TsvParser,
  detectHeaders,
  sanitizeHeaders,
  MappingEngine,
  calculateSimilarity,
  builtInTransformers,
  TransformerEngine,
  builtInValidators,
  ValidationEngine,
  DuplicateEngine,
  FilterEngine,
  SortEngine,
  HistoryManager,
  ErrorExporter,
  createImporter,
  ImporterSchema
} from '../src';

describe('Data Importer - Comprehensive Test Suite', () => {
  // 1. File Validation
  describe('FileValidator', () => {
    const validator = new FileValidator({
      acceptedFiles: ['csv', 'xlsx'],
      maxFileSize: 10 * 1024 * 1024
    });

    it('rejects empty files', () => {
      const emptyFile = new File([], 'test.csv', { type: 'text/csv' });
      expect(() => validator.validate(emptyFile)).toThrowError(/completely empty/);
    });

    it('rejects files exceeding max size', () => {
      const bigFile = new File(['x'], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(bigFile, 'size', { value: 15 * 1024 * 1024 });
      expect(() => validator.validate(bigFile)).toThrowError(/exceeds maximum allowed size/);
    });

    it('rejects unsupported extensions', () => {
      const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      expect(() => validator.validate(pdfFile)).toThrowError(/is not supported/);
    });

    it('accepts valid csv files', () => {
      const validFile = new File(['col1,col2\nval1,val2'], 'valid.csv', { type: 'text/csv' });
      expect(() => validator.validate(validFile)).not.toThrow();
    });
  });

  // 2. CSV Parser
  describe('CsvParser', () => {
    const parser = new CsvParser();

    it('parses standard comma separated values', async () => {
      const csv = 'name,age,email\nAlice,30,alice@example.com\nBob,25,bob@example.com';
      const result = await parser.parse(csv);
      expect(result.headers).toEqual(['name', 'age', 'email']);
      expect(result.rawRows).toHaveLength(2);
      expect(result.rawRows[0]).toEqual({ name: 'Alice', age: '30', email: 'alice@example.com' });
    });

    it('correctly handles quoted fields with commas and escaped quotes', async () => {
      const csv = 'name,notes\n"Smith, John","He said ""Hello world"""';
      const result = await parser.parse(csv);
      expect(result.rawRows[0].name).toBe('Smith, John');
      expect(result.rawRows[0].notes).toBe('He said "Hello world"');
    });

    it('correctly handles multiline values within quotes', async () => {
      const csv = 'id,description\n1,"Line 1\nLine 2\nLine 3"';
      const result = await parser.parse(csv);
      expect(result.rawRows[0].description).toBe('Line 1\nLine 2\nLine 3');
    });

    it('strips UTF-8 BOM automatically', async () => {
      const csv = '\uFEFFname,city\nJane,London';
      const result = await parser.parse(csv);
      expect(result.headers).toEqual(['name', 'city']);
      expect(result.rawRows[0].name).toBe('Jane');
    });

    it('autodetects semicolon and pipe delimiters', async () => {
      const semiCsv = 'id;name;status\n1;Product A;Active\n2;Product B;Inactive';
      const result = await parser.parse(semiCsv);
      expect(result.headers).toEqual(['id', 'name', 'status']);
      expect(result.rawRows).toHaveLength(2);
    });
  });

  // 3. TSV Parser
  describe('TsvParser', () => {
    const parser = new TsvParser();

    it('parses tab-separated values correctly', async () => {
      const tsv = 'code\tname\tprice\nSKU1\tWidget\t19.99\nSKU2\tGadget\t29.99';
      const result = await parser.parse(tsv);
      expect(result.headers).toEqual(['code', 'name', 'price']);
      expect(result.rawRows).toHaveLength(2);
      expect(result.rawRows[0].name).toBe('Widget');
    });
  });

  // 4. Header Detector
  describe('Header Detection & Sanitization', () => {
    it('sanitizes duplicate headers by appending unique suffix', () => {
      const raw = ['Email', 'Name', 'Email', 'Phone', 'Email'];
      const sanitized = sanitizeHeaders(raw);
      expect(sanitized).toEqual(['Email', 'Name', 'Email_1', 'Phone', 'Email_2']);
    });

    it('fills in missing / empty header names', () => {
      const raw = ['ID', '', 'Role'];
      const sanitized = sanitizeHeaders(raw);
      expect(sanitized).toEqual(['ID', 'Column_2', 'Role']);
    });

    it('detects headers with high confidence when row 0 contains text and row 1 numbers', () => {
      const rows = [
        ['Year', 'Count', 'Revenue'],
        ['2020', '100', '5000'],
        ['2021', '120', '6500']
      ];
      const res = detectHeaders(rows);
      expect(res.hasHeaders).toBe(true);
      expect(res.confidence).toBeGreaterThan(0.6);
      expect(res.headers).toEqual(['Year', 'Count', 'Revenue']);
    });
  });

  // 5. Column Mapping Engine & Fuzzy Matching
  describe('MappingEngine', () => {
    const schema: ImporterSchema = [
      { key: 'first_name', label: 'First Name', type: 'string', aliases: ['given_name', 'fname'] },
      { key: 'email', label: 'Email Address', type: 'email', aliases: ['e-mail', 'mail', 'email'] },
      { key: 'phone_number', label: 'Phone Number', type: 'phone', aliases: ['telephone', 'mobile'] },
      { key: 'salary', label: 'Annual Salary', type: 'number' }
    ];

    const engine = new MappingEngine(schema);

    it('matches exact field keys and labels', () => {
      const mappings = engine.mapHeaders(['first_name', 'Annual Salary']);
      expect(mappings[0].targetField).toBe('first_name');
      expect(mappings[0].strategy).toBe('exact');
      expect(mappings[1].targetField).toBe('salary');
      expect(mappings[1].strategy).toBe('exact');
    });

    it('matches configured aliases with high confidence', () => {
      const mappings = engine.mapHeaders(['e-mail', 'mobile']);
      expect(mappings[0].targetField).toBe('email');
      expect(mappings[0].strategy).toBe('alias');
      expect(mappings[0].confidence).toBeGreaterThanOrEqual(0.9);

      expect(mappings[1].targetField).toBe('phone_number');
      expect(mappings[1].strategy).toBe('alias');
    });

    it('matches normalized variations (case and spaces)', () => {
      const mappings = engine.mapHeaders(['emailaddress', 'FirstName']);
      expect(mappings[0].targetField).toBe('email');
      expect(mappings[1].targetField).toBe('first_name');
    });

    it('matches fuzzy typos', () => {
      const sim = calculateSimilarity('phne number', 'phone number');
      expect(sim).toBeGreaterThan(0.7);
    });
  });

  // 6. Transformation Engine
  describe('TransformerEngine', () => {
    const schema: ImporterSchema = [
      {
        key: 'fullName',
        label: 'Full Name',
        type: 'string',
        transformers: [builtInTransformers.trim(), builtInTransformers.capitalize()]
      },
      {
        key: 'active',
        label: 'Active',
        type: 'boolean',
        transformers: [builtInTransformers.stringToBoolean()]
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        transformers: [builtInTransformers.stringToNumber()]
      }
    ];

    const engine = new TransformerEngine(schema);

    it('applies trim and capitalize pipeline', () => {
      const transformed = engine.transformRow({ fullName: '  john doe  ' }, 0);
      expect(transformed.fullName).toBe('John Doe');
    });

    it('transforms string to boolean', () => {
      expect(engine.transformRow({ active: 'yes' }, 0).active).toBe(true);
      expect(engine.transformRow({ active: '0' }, 0).active).toBe(false);
    });

    it('transforms formatted currency string to number', () => {
      const res = engine.transformRow({ amount: ' $1,250.50 ' }, 0);
      expect(res.amount).toBe(1250.5);
    });
  });

  // 7. Validation Engine
  describe('ValidationEngine', () => {
    const schema: ImporterSchema = [
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validators: [builtInValidators.email()]
      },
      {
        key: 'age',
        label: 'Age',
        type: 'integer',
        validators: [builtInValidators.min(18), builtInValidators.max(100)]
      }
    ];

    const engine = new ValidationEngine(schema);

    it('flags missing required fields', async () => {
      const summary = await engine.validateAll([{ email: '', age: 25 }], ['row_1']);
      expect(summary.invalidRowsCount).toBe(1);
      expect(summary.errorsByCell['row_1:email'][0].code).toBe('REQUIRED');
    });

    it('flags invalid email addresses', async () => {
      const summary = await engine.validateAll([{ email: 'not-an-email', age: 25 }], ['row_1']);
      expect(summary.invalidRowsCount).toBe(1);
      expect(summary.errorsByCell['row_1:email'][0].code).toBe('INVALID_EMAIL');
    });

    it('flags min / max integer bounds', async () => {
      const summary = await engine.validateAll([{ email: 'valid@example.com', age: 15 }], ['row_1']);
      expect(summary.invalidRowsCount).toBe(1);
      expect(summary.errorsByCell['row_1:age'][0].code).toBe('MIN_VALUE');
    });

    it('supports custom async validators', async () => {
      const customSchema: ImporterSchema = [
        {
          key: 'username',
          label: 'Username',
          type: 'string',
          validators: [
            {
              name: 'check_available',
              isAsync: true,
              validator: async (val) => {
                await new Promise((r) => setTimeout(r, 10));
                return val === 'taken_user' ? 'Username is already taken' : null;
              }
            }
          ]
        }
      ];

      const customEngine = new ValidationEngine(customSchema);
      const res = await customEngine.validateAll(
        [{ username: 'taken_user' }, { username: 'available_user' }],
        ['r1', 'r2']
      );

      expect(res.invalidRowsCount).toBe(1);
      expect(res.errorsByCell['r1:username'][0].message).toBe('Username is already taken');
      expect(res.errorsByCell['r2:username']).toBeUndefined();
    });
  });

  // 8. Duplicate Engine
  describe('DuplicateEngine', () => {
    it('detects single-field duplicates', async () => {
      const schema: ImporterSchema = [
        { key: 'email', label: 'Email', type: 'email', unique: true }
      ];

      const dupEngine = new DuplicateEngine(schema);
      const rows = [
        { email: 'user@test.com' },
        { email: 'other@test.com' },
        { email: 'user@test.com' }
      ];
      const res = await dupEngine.detectDuplicates(rows, ['r1', 'r2', 'r3']);

      expect(res.duplicateRowIds.has('r3')).toBe(true);
      expect(res.duplicateRowIds.has('r1')).toBe(false); // keep-first by default
      expect(res.duplicateRowIds.size).toBe(1);
    });

    it('detects composite duplicate keys', async () => {
      const schema: ImporterSchema = [
        {
          key: 'sku',
          label: 'SKU',
          type: 'string',
          duplicate: {
            compositeFields: ['sku', 'warehouse']
          }
        },
        { key: 'warehouse', label: 'Warehouse', type: 'string' }
      ];

      const dupEngine = new DuplicateEngine(schema);
      const rows = [
        { sku: 'ITEM-1', warehouse: 'A' },
        { sku: 'ITEM-1', warehouse: 'B' }, // Different warehouse -> valid!
        { sku: 'ITEM-1', warehouse: 'A' }  // Duplicate!
      ];

      const res = await dupEngine.detectDuplicates(rows, ['r1', 'r2', 'r3']);
      expect(res.duplicateRowIds.has('r3')).toBe(true);
      expect(res.duplicateRowIds.size).toBe(1);
    });
  });

  // 9. Filtering Engine
  describe('FilterEngine', () => {
    const engine = new FilterEngine();
    const rows = [
      { id: 1, name: 'Alice', role: 'admin', age: 30 },
      { id: 2, name: 'Bob', role: 'editor', age: 24 },
      { id: 3, name: 'Charlie', role: 'admin', age: 40 },
      { id: 4, name: 'David', role: 'viewer', age: 19 }
    ];
    const rowIds = ['1', '2', '3', '4'];

    it('filters using contains operator', () => {
      const res = engine.filterRows(rows, rowIds, {
        condition: 'AND',
        rules: [{ field: 'name', operator: 'contains', value: 'li' }]
      });
      expect(res.filteredRows.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('filters with nested AND/OR condition groups', () => {
      const res = engine.filterRows(rows, rowIds, {
        condition: 'OR',
        rules: [
          { field: 'role', operator: 'equals', value: 'viewer' },
          { field: 'age', operator: 'greaterThan', value: 35 }
        ]
      });
      expect(res.filteredRows.map((r) => r.name)).toEqual(['Charlie', 'David']);
    });
  });

  // 10. Sorting Engine
  describe('SortEngine', () => {
    const engine = new SortEngine();
    const rows = [
      { name: 'Charlie', score: 90 },
      { name: 'Alice', score: 85 },
      { name: 'Bob', score: 90 }
    ];
    const rowIds = ['1', '2', '3'];

    it('performs multi-column stable sort', () => {
      const res = engine.sortRows(rows, rowIds, [
        { field: 'score', direction: 'desc' },
        { field: 'name', direction: 'asc' }
      ]);

      expect(res.sortedRows.map((r) => r.name)).toEqual(['Bob', 'Charlie', 'Alice']);
    });
  });

  // 11. History / Undo-Redo
  describe('HistoryManager', () => {
    it('manages undo and redo stacks correctly', () => {
      const history = new HistoryManager();
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);

      history.push({
        type: 'cell_update',
        rowId: 'r1',
        field: 'name',
        oldValue: 'Old',
        newValue: 'New'
      });

      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);

      const popped = history.popUndo();
      expect(popped?.type).toBe('cell_update');
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);

      const redone = history.popRedo();
      expect(redone?.type).toBe('cell_update');
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });
  });

  // 12. End-to-End Core Lifecycle
  describe('DataImporterCore End-to-End', () => {
    const schema: ImporterSchema = [
      { key: 'name', label: 'Full Name', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'qty', label: 'Quantity', type: 'integer' }
    ];

    it('completes the full upload -> parse -> map -> validate -> edit -> import cycle', async () => {
      const mockImportApi = vi.fn().mockResolvedValue({
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        warningRows: 0,
        importedRows: 2,
        failedRows: 0,
        duration: 50
      });

      const importer = createImporter({
        schema,
        onImport: mockImportApi
      });

      const csvContent = 'Full Name,Email,Quantity\nSarah Connor,sarah@skynet.net,5\nJohn Connor,john@resistance.org,10';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // 1. Load file
      await importer.loadFile(file);
      const state1 = importer.getState();
      expect(state1.currentStep).toBe('mapping');
      expect(state1.mappings).toHaveLength(3);

      // 2. Confirm mapping
      await importer.confirmMappingAndPrepare();
      const state2 = importer.getState();
      expect(state2.currentStep).toBe('review');
      expect(state2.rows).toHaveLength(2);
      expect(state2.statistics.valid).toBe(2);
      expect(state2.statistics.invalid).toBe(0);

      // 3. Edit a cell
      importer.updateCell(state2.rowIds[0], 'qty', 15);
      expect(importer.getState().rows[0].qty).toBe(15);
      expect(importer.getState().canUndo).toBe(true);

      // 4. Undo edit
      importer.undo();
      expect(importer.getState().rows[0].qty).toBe(5);

      // 5. Execute import
      const result = await importer.import();
      expect(mockImportApi).toHaveBeenCalledTimes(1);
      expect(result.importedRows).toBe(2);
      expect(importer.getState().currentStep).toBe('result');

      importer.destroy();
    });
  });
});
