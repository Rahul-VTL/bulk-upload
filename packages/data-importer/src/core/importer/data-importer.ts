import {
  ImporterOptions,
  ImporterSchema,
  ImporterState,
  SheetInfo,
  ColumnMapping,
  ValidationError,
  ImportStatistics,
  FilterGroup,
  SortRule,
  GridCellPosition,
  GridCellRange,
  ImportResult,
  ImportProgress
} from '../../types';
import { EventEmitter } from '../events/event-emitter';
import { FileValidator } from '../../parser/file-validator';
import { ParserRegistry } from '../../parser/parser-registry';
import { MappingEngine } from '../../mapper/mapping-engine';
import { TransformerEngine } from '../../transformer/transformer-engine';
import { ValidationEngine } from '../../validator/validation-engine';
import { DuplicateEngine } from '../../duplicate/duplicate-engine';
import { FilterEngine } from '../../grid/filtering/filter-engine';
import { SortEngine } from '../../grid/sorting/sort-engine';
import { HistoryManager } from '../../grid/history/history-manager';
import { SelectionManager } from '../../grid/selection/selection-manager';
import { ImportEngine } from '../../importer/import-engine';
import { ErrorExporter } from '../../importer/error-exporter';
import { ImporterError } from '../errors';

export class DataImporterCore {
  private schema: ImporterSchema;
  private options: ImporterOptions;
  private events: EventEmitter = new EventEmitter();

  // Internal subsystems
  private fileValidator: FileValidator;
  private parserRegistry: ParserRegistry;
  private mappingEngine: MappingEngine;
  private transformerEngine: TransformerEngine;
  private validationEngine: ValidationEngine;
  private duplicateEngine: DuplicateEngine;
  private filterEngine: FilterEngine;
  private sortEngine: SortEngine;
  private historyManager: HistoryManager;
  private selectionManager: SelectionManager;
  private importEngine: ImportEngine;

  // Internal state
  private state: ImporterState;
  private subscribers: Set<(state: ImporterState) => void> = new Set();
  private nextRowIdCounter = 1;

  constructor(options: ImporterOptions) {
    this.schema = options.schema;
    this.options = options;

    this.fileValidator = new FileValidator({
      acceptedFiles: options.acceptedFiles,
      maxFileSize: options.maxFileSize
    });
    this.parserRegistry = new ParserRegistry();
    this.mappingEngine = new MappingEngine(this.schema, {
      autoMapThreshold: options.autoMapThreshold
    });
    this.transformerEngine = new TransformerEngine(this.schema);
    this.validationEngine = new ValidationEngine(this.schema);
    this.duplicateEngine = new DuplicateEngine(this.schema, options.checkDuplicate);
    this.filterEngine = new FilterEngine();
    this.sortEngine = new SortEngine();
    this.historyManager = new HistoryManager();
    this.selectionManager = new SelectionManager();
    this.importEngine = new ImportEngine(options);

    this.state = this.getInitialState();
  }

  private getInitialState(): ImporterState {
    return {
      currentStep: 'upload',
      file: null,
      fileName: null,
      fileSize: null,
      fileType: null,
      sheets: [],
      selectedSheetId: null,
      sourceHeaders: [],
      mappings: [],
      unmappedHeaders: [],
      rows: [],
      rowIds: [],
      originalRows: [],
      errors: {},
      rowErrors: {},
      warnings: {},
      duplicates: new Set(),
      statistics: {
        total: 0,
        valid: 0,
        invalid: 0,
        warnings: 0,
        duplicates: 0,
        empty: 0,
        imported: 0,
        failed: 0
      },
      filters: null,
      searchQuery: '',
      sorting: [],
      selectedRowIds: new Set(),
      activeCell: null,
      selectedRange: null,
      hiddenColumns: new Set(),
      columnWidths: {},
      canUndo: false,
      canRedo: false,
      isLoading: false,
      loadingMessage: null,
      progress: null,
      result: null
    };
  }

  public getState(): ImporterState {
    return this.state;
  }

  public subscribe(listener: (state: ImporterState) => void): () => void {
    this.subscribers.add(listener);
    listener(this.state);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private updateState(updater: Partial<ImporterState> | ((prev: ImporterState) => Partial<ImporterState>)): void {
    const changes = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = {
      ...this.state,
      ...changes,
      canUndo: this.historyManager.canUndo(),
      canRedo: this.historyManager.canRedo()
    };

    // Notify subscribers
    for (const sub of this.subscribers) {
      try {
        sub(this.state);
      } catch (err) {
        console.error('Error notifying importer state subscriber:', err);
      }
    }

    this.events.emit('stateChanged', { state: this.state });
  }

  public on<K extends keyof import('../../types').ImporterEvents>(
    event: K,
    listener: (data: import('../../types').ImporterEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  public off<K extends keyof import('../../types').ImporterEvents>(
    event: K,
    listener: (data: import('../../types').ImporterEvents[K]) => void
  ): void {
    this.events.off(event, listener);
  }

  // --- Step 1: File Loading & Validation ---

  public async loadFile(file: File): Promise<void> {
    const t0 = performance.now();
    this.fileValidator.validate(file);

    this.updateState({
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || file.name.split('.').pop() || '',
      isLoading: true,
      loadingMessage: 'Reading file...'
    });

    this.events.emit('fileSelected', { file });

    try {
      await this.parse();
    } finally {
      const dur = performance.now() - t0;
      this.options.observability?.onTiming?.('file_load_parse', dur);
    }
  }

  // --- Step 2: Parsing ---

  public async parse(): Promise<void> {
    const { file } = this.state;
    if (!file) {
      throw new ImporterError({ code: 'NO_FILE', message: 'No file to parse.' });
    }

    const parser = this.parserRegistry.getParser(file);
    const parsed = await parser.parse(file);

    this.events.emit('fileParsed', {
      sheets: parsed.sheets,
      headers: parsed.headers,
      rowCount: parsed.totalRawRows
    });

    if (parsed.sheets.length > 1) {
      // Prompt user to select sheet
      this.updateState({
        sheets: parsed.sheets,
        selectedSheetId: parsed.selectedSheetId,
        sourceHeaders: parsed.headers,
        currentStep: 'sheet-select',
        isLoading: false,
        loadingMessage: null
      });
    } else {
      // Single sheet: proceed directly to mapping
      this.updateState({
        sheets: parsed.sheets,
        selectedSheetId: parsed.selectedSheetId,
        sourceHeaders: parsed.headers,
        originalRows: parsed.rawRows,
        isLoading: false,
        loadingMessage: null
      });
      await this.initMapping(parsed.headers, parsed.rawRows);
    }
  }

  public async selectSheet(sheetId: string): Promise<void> {
    const { file, sheets } = this.state;
    if (!file) return;

    const sheet = sheets.find((s) => s.id === sheetId);
    if (!sheet) return;

    this.updateState({
      selectedSheetId: sheetId,
      isLoading: true,
      loadingMessage: `Loading sheet "${sheet.name}"...`
    });

    this.events.emit('sheetSelected', { sheetId });

    const parser = this.parserRegistry.getParser(file);
    const parsed = await parser.parse(file, { selectedSheetId: sheetId });

    this.updateState({
      sourceHeaders: parsed.headers,
      originalRows: parsed.rawRows,
      isLoading: false,
      loadingMessage: null
    });

    await this.initMapping(parsed.headers, parsed.rawRows);
  }

  // --- Step 3: Column Mapping ---

  private async initMapping(headers: string[], rawRows: Record<string, unknown>[]): Promise<void> {
    this.events.emit('mappingStarted', undefined);

    const mappings = this.mappingEngine.mapHeaders(headers, rawRows);
    const unmapped = mappings.filter((m) => !m.targetField).map((m) => m.sourceColumn);

    this.updateState({
      mappings,
      unmappedHeaders: unmapped,
      currentStep: 'mapping'
    });

    this.events.emit('mappingCompleted', { mappings });
  }

  public setMapping(sourceColumn: string, targetField: string | null): void {
    const mappings = [...this.state.mappings];
    const index = mappings.findIndex((m) => m.sourceColumn === sourceColumn);

    if (index >= 0) {
      const updated: ColumnMapping = {
        ...mappings[index],
        targetField,
        strategy: 'manual',
        confidence: targetField ? 1.0 : 0
      };
      mappings[index] = updated;

      const unmapped = mappings.filter((m) => !m.targetField).map((m) => m.sourceColumn);
      this.updateState({ mappings, unmappedHeaders: unmapped });
      this.events.emit('mappingChanged', { mapping: updated });
    }
  }

  public autoMap(): void {
    const { sourceHeaders, originalRows } = this.state;
    const mappings = this.mappingEngine.mapHeaders(sourceHeaders, originalRows);
    const unmapped = mappings.filter((m) => !m.targetField).map((m) => m.sourceColumn);

    this.updateState({ mappings, unmappedHeaders: unmapped });
    this.events.emit('mappingCompleted', { mappings });
  }

  public async confirmMappingAndPrepare(): Promise<void> {
    this.updateState({
      isLoading: true,
      loadingMessage: 'Transforming and validating data...'
    });

    // 1. Transform rawRows according to column mapping
    const { originalRows, mappings } = this.state;

    // Create field lookup map: targetField -> sourceColumn
    const targetToSource = new Map<string, string>();
    for (const m of mappings) {
      if (m.targetField) {
        targetToSource.set(m.targetField, m.sourceColumn);
      }
    }

    const mappedRows: Record<string, unknown>[] = [];
    const rowIds: string[] = [];

    for (let i = 0; i < originalRows.length; i++) {
      const orig = originalRows[i];
      const mappedRow: Record<string, unknown> = {};

      for (const col of this.schema) {
        const sourceCol = targetToSource.get(col.key);
        if (sourceCol && orig[sourceCol] !== undefined) {
          mappedRow[col.key] = orig[sourceCol];
        } else {
          mappedRow[col.key] = col.defaultValue !== undefined ? col.defaultValue : null;
        }
      }

      mappedRows.push(mappedRow);
      rowIds.push(`row_${this.nextRowIdCounter++}`);
    }

    // 2. Run transformers
    this.events.emit('transformationStarted', undefined);
    const transformed = this.transformerEngine.transformRows(mappedRows);
    this.events.emit('transformationCompleted', { rowCount: transformed.length });

    this.updateState({
      rows: transformed,
      rowIds,
      currentStep: 'review'
    });

    // 3. Run validation & duplicates
    await this.validateAndDetectDuplicates(transformed, rowIds);

    this.updateState({
      isLoading: false,
      loadingMessage: null
    });
  }

  // --- Step 4: Validation & Duplicates ---

  public async validate(): Promise<void> {
    await this.validateAndDetectDuplicates(this.state.rows, this.state.rowIds);
  }

  private async validateAndDetectDuplicates(
    rows: Record<string, unknown>[],
    rowIds: string[]
  ): Promise<void> {
    this.events.emit('validationStarted', undefined);

    const valSummary = await this.validationEngine.validateAll(rows, rowIds);
    const dupSummary = await this.duplicateEngine.detectDuplicates(rows, rowIds);

    // Merge duplicate errors & warnings
    const combinedErrors = { ...valSummary.errorsByCell };
    const combinedRowErrors = { ...valSummary.errorsByRow };
    const combinedWarnings = { ...valSummary.warningsByCell };

    for (const dErr of dupSummary.duplicateErrors) {
      const cellKey = `${dErr.rowId}:${dErr.field}`;
      if (!combinedErrors[cellKey]) combinedErrors[cellKey] = [];
      combinedErrors[cellKey].push(dErr);

      if (!combinedRowErrors[dErr.rowId]) combinedRowErrors[dErr.rowId] = [];
      combinedRowErrors[dErr.rowId].push(dErr);
    }

    for (const dWarn of dupSummary.duplicateWarnings) {
      const cellKey = `${dWarn.rowId}:${dWarn.field}`;
      if (!combinedWarnings[cellKey]) combinedWarnings[cellKey] = [];
      combinedWarnings[cellKey].push(dWarn);
    }

    const invalidCount = Object.keys(combinedRowErrors).length;
    const warningCount = Object.keys(combinedWarnings).length;
    const validCount = Math.max(0, rows.length - invalidCount);

    const statistics: ImportStatistics = {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
      warnings: warningCount,
      duplicates: dupSummary.duplicateRowIds.size,
      empty: 0,
      imported: 0,
      failed: 0
    };

    this.updateState({
      errors: combinedErrors,
      rowErrors: combinedRowErrors,
      warnings: combinedWarnings,
      duplicates: dupSummary.duplicateRowIds,
      statistics
    });

    this.events.emit('validationCompleted', {
      validCount,
      errorCount: invalidCount,
      warningCount
    });

    this.events.emit('duplicateDetectionCompleted', {
      duplicateCount: dupSummary.duplicateRowIds.size
    });
  }

  // --- Step 5: Grid Operations (Editing, Rows, Selection, Search, Sort, Filter) ---

  public updateCell(rowId: string, field: string, rawValue: unknown): void {
    const rowIndex = this.state.rowIds.indexOf(rowId);
    if (rowIndex === -1) return;

    const row = this.state.rows[rowIndex];
    const oldValue = row[field];
    if (oldValue === rawValue) return;

    // Apply transformer
    const transformedValue = this.transformerEngine.transformCell(field, rawValue, row, rowIndex);

    // Save to history for undo
    this.historyManager.push({
      type: 'cell_update',
      rowId,
      field,
      oldValue,
      newValue: transformedValue
    });

    const updatedRows = [...this.state.rows];
    updatedRows[rowIndex] = {
      ...row,
      [field]: transformedValue
    };

    this.updateState({ rows: updatedRows });
    this.events.emit('rowUpdated', { rowId, field, oldValue, newValue: transformedValue });

    // Revalidate single cell / row asynchronously
    this.revalidateRow(rowId, rowIndex, updatedRows);
  }

  public updateCells(
    changes: Array<{ rowId: string; field: string; value: unknown }>
  ): void {
    if (changes.length === 0) return;

    const historyItems: Array<{
      rowId: string;
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];

    const updatedRows = [...this.state.rows];
    const rowIdToIndex = new Map<string, number>();
    this.state.rowIds.forEach((id, idx) => rowIdToIndex.set(id, idx));

    const touchedRowIds = new Set<string>();

    for (const change of changes) {
      const idx = rowIdToIndex.get(change.rowId);
      if (idx === undefined) continue;

      const row = updatedRows[idx];
      const oldValue = row[change.field];
      const transformedVal = this.transformerEngine.transformCell(
        change.field,
        change.value,
        row,
        idx
      );

      historyItems.push({
        rowId: change.rowId,
        field: change.field,
        oldValue,
        newValue: transformedVal
      });

      updatedRows[idx] = {
        ...updatedRows[idx],
        [change.field]: transformedVal
      };
      touchedRowIds.add(change.rowId);
    }

    this.historyManager.push({
      type: 'bulk_cell_update',
      changes: historyItems
    });

    this.updateState({ rows: updatedRows });
    this.events.emit('rowsUpdated', {
      rowIds: Array.from(touchedRowIds),
      changes: {}
    });

    // Revalidate modified rows
    this.validateAndDetectDuplicates(updatedRows, this.state.rowIds);
  }

  public addRow(rowData?: Record<string, unknown>, atIndex?: number): string {
    const newId = `row_${this.nextRowIdCounter++}`;
    const insertIdx =
      atIndex !== undefined ? Math.max(0, Math.min(this.state.rows.length, atIndex)) : this.state.rows.length;

    const newRowObj: Record<string, unknown> = {};
    for (const col of this.schema) {
      newRowObj[col.key] =
        rowData && rowData[col.key] !== undefined
          ? rowData[col.key]
          : col.defaultValue !== undefined
            ? col.defaultValue
            : null;
    }

    const transformed = this.transformerEngine.transformRow(newRowObj, insertIdx, this.state.rows);

    const newRows = [...this.state.rows];
    const newRowIds = [...this.state.rowIds];
    newRows.splice(insertIdx, 0, transformed);
    newRowIds.splice(insertIdx, 0, newId);

    this.historyManager.push({
      type: 'rows_added',
      rows: [{ index: insertIdx, rowId: newId, data: transformed }]
    });

    this.updateState({ rows: newRows, rowIds: newRowIds });
    this.events.emit('rowsAdded', { rows: [transformed] });

    this.validateAndDetectDuplicates(newRows, newRowIds);
    return newId;
  }

  public duplicateRow(rowId: string): string | null {
    const idx = this.state.rowIds.indexOf(rowId);
    if (idx === -1) return null;
    const rowData = { ...this.state.rows[idx] };
    return this.addRow(rowData, idx + 1);
  }

  public deleteRows(rowIdsToDelete: string[]): void {
    if (rowIdsToDelete.length === 0) return;
    const toDeleteSet = new Set(rowIdsToDelete);

    const keptRows: Record<string, unknown>[] = [];
    const keptRowIds: string[] = [];
    const historyRows: Array<{ index: number; rowId: string; data: Record<string, unknown> }> = [];

    for (let i = 0; i < this.state.rows.length; i++) {
      const id = this.state.rowIds[i];
      if (toDeleteSet.has(id)) {
        historyRows.push({ index: i, rowId: id, data: this.state.rows[i] });
      } else {
        keptRows.push(this.state.rows[i]);
        keptRowIds.push(id);
      }
    }

    this.historyManager.push({
      type: 'rows_deleted',
      rows: historyRows
    });

    // Remove from selection
    this.selectionManager.deselectRows(rowIdsToDelete);

    this.updateState({
      rows: keptRows,
      rowIds: keptRowIds,
      selectedRowIds: this.selectionManager.getSelectedRowIds()
    });

    this.events.emit('rowsDeleted', { rowIds: rowIdsToDelete });
    this.validateAndDetectDuplicates(keptRows, keptRowIds);
  }

  // --- Undo / Redo ---

  public undo(): void {
    const action = this.historyManager.popUndo();
    if (!action) return;

    if (action.type === 'cell_update') {
      const idx = this.state.rowIds.indexOf(action.rowId);
      if (idx >= 0) {
        const updated = [...this.state.rows];
        updated[idx] = { ...updated[idx], [action.field]: action.oldValue };
        this.updateState({ rows: updated });
        this.revalidateRow(action.rowId, idx, updated);
      }
    } else if (action.type === 'bulk_cell_update') {
      const updated = [...this.state.rows];
      const idMap = new Map<string, number>();
      this.state.rowIds.forEach((id, i) => idMap.set(id, i));

      for (const ch of action.changes) {
        const idx = idMap.get(ch.rowId);
        if (idx !== undefined) {
          updated[idx] = { ...updated[idx], [ch.field]: ch.oldValue };
        }
      }
      this.updateState({ rows: updated });
      this.validateAndDetectDuplicates(updated, this.state.rowIds);
    } else if (action.type === 'rows_added') {
      const idsToRemove = new Set(action.rows.map((r) => r.rowId));
      const keptRows = this.state.rows.filter((_, i) => !idsToRemove.has(this.state.rowIds[i]));
      const keptIds = this.state.rowIds.filter((id) => !idsToRemove.has(id));
      this.updateState({ rows: keptRows, rowIds: keptIds });
      this.validateAndDetectDuplicates(keptRows, keptIds);
    } else if (action.type === 'rows_deleted') {
      const newRows = [...this.state.rows];
      const newIds = [...this.state.rowIds];
      for (const item of action.rows) {
        newRows.splice(item.index, 0, item.data);
        newIds.splice(item.index, 0, item.rowId);
      }
      this.updateState({ rows: newRows, rowIds: newIds });
      this.validateAndDetectDuplicates(newRows, newIds);
    }
  }

  public redo(): void {
    const action = this.historyManager.popRedo();
    if (!action) return;

    if (action.type === 'cell_update') {
      const idx = this.state.rowIds.indexOf(action.rowId);
      if (idx >= 0) {
        const updated = [...this.state.rows];
        updated[idx] = { ...updated[idx], [action.field]: action.newValue };
        this.updateState({ rows: updated });
        this.revalidateRow(action.rowId, idx, updated);
      }
    } else if (action.type === 'bulk_cell_update') {
      const updated = [...this.state.rows];
      const idMap = new Map<string, number>();
      this.state.rowIds.forEach((id, i) => idMap.set(id, i));

      for (const ch of action.changes) {
        const idx = idMap.get(ch.rowId);
        if (idx !== undefined) {
          updated[idx] = { ...updated[idx], [ch.field]: ch.newValue };
        }
      }
      this.updateState({ rows: updated });
      this.validateAndDetectDuplicates(updated, this.state.rowIds);
    } else if (action.type === 'rows_added') {
      const newRows = [...this.state.rows];
      const newIds = [...this.state.rowIds];
      for (const item of action.rows) {
        newRows.splice(item.index, 0, item.data);
        newIds.splice(item.index, 0, item.rowId);
      }
      this.updateState({ rows: newRows, rowIds: newIds });
      this.validateAndDetectDuplicates(newRows, newIds);
    } else if (action.type === 'rows_deleted') {
      const idsToRemove = new Set(action.rows.map((r) => r.rowId));
      const keptRows = this.state.rows.filter((_, i) => !idsToRemove.has(this.state.rowIds[i]));
      const keptIds = this.state.rowIds.filter((id) => !idsToRemove.has(id));
      this.updateState({ rows: keptRows, rowIds: keptIds });
      this.validateAndDetectDuplicates(keptRows, keptIds);
    }
  }

  private async revalidateRow(
    rowId: string,
    rowIndex: number,
    rows: Record<string, unknown>[]
  ): Promise<void> {
    const row = rows[rowIndex];
    if (!row) return;

    // Remove existing errors for this row
    const newErrors = { ...this.state.errors };
    const newRowErrors = { ...this.state.rowErrors };
    const newWarnings = { ...this.state.warnings };

    delete newRowErrors[rowId];
    for (const col of this.schema) {
      delete newErrors[`${rowId}:${col.key}`];
      delete newWarnings[`${rowId}:${col.key}`];
    }

    // Validate each column
    for (const col of this.schema) {
      const issues = await this.validationEngine.validateField(
        row[col.key],
        row,
        col.key,
        rowIndex,
        rows,
        rowId
      );

      for (const issue of issues) {
        const cellKey = `${rowId}:${col.key}`;
        if (issue.severity === 'error') {
          if (!newErrors[cellKey]) newErrors[cellKey] = [];
          newErrors[cellKey].push(issue);

          if (!newRowErrors[rowId]) newRowErrors[rowId] = [];
          newRowErrors[rowId].push(issue);
        } else if (issue.severity === 'warning') {
          if (!newWarnings[cellKey]) newWarnings[cellKey] = [];
          newWarnings[cellKey].push(issue);
        }
      }
    }

    const invalidCount = Object.keys(newRowErrors).length;
    const warningCount = Object.keys(newWarnings).length;

    this.updateState({
      errors: newErrors,
      rowErrors: newRowErrors,
      warnings: newWarnings,
      statistics: {
        ...this.state.statistics,
        invalid: invalidCount,
        valid: Math.max(0, rows.length - invalidCount),
        warnings: warningCount
      }
    });
  }

  // --- Filtering & Sorting & Selection ---

  public setFilter(filters: FilterGroup | null): void {
    this.updateState({ filters });
  }

  public setSearch(searchQuery: string): void {
    this.updateState({ searchQuery });
  }

  public setSorting(sorting: SortRule[]): void {
    this.updateState({ sorting });
  }

  public getDisplayRows(): {
    rows: Record<string, unknown>[];
    rowIds: string[];
    indices: number[];
  } {
    // 1. Filter
    const { filteredRows, filteredRowIds, indices } = this.filterEngine.filterRows(
      this.state.rows,
      this.state.rowIds,
      this.state.filters,
      this.state.searchQuery
    );

    // 2. Sort
    if (this.state.sorting.length > 0) {
      const { sortedRows, sortedRowIds } = this.sortEngine.sortRows(
        filteredRows,
        filteredRowIds,
        this.state.sorting
      );
      return { rows: sortedRows, rowIds: sortedRowIds, indices };
    }

    return { rows: filteredRows, rowIds: filteredRowIds, indices };
  }

  public toggleRowSelection(rowId: string, force?: boolean): void {
    this.selectionManager.toggleRow(rowId, force);
    this.updateState({ selectedRowIds: this.selectionManager.getSelectedRowIds() });
  }

  public selectAllRows(): void {
    this.selectionManager.selectAll(this.state.rowIds);
    this.updateState({ selectedRowIds: this.selectionManager.getSelectedRowIds() });
  }

  public clearSelection(): void {
    this.selectionManager.clearSelection();
    this.updateState({
      selectedRowIds: this.selectionManager.getSelectedRowIds(),
      activeCell: null
    });
  }

  public setActiveCell(cell: GridCellPosition | null): void {
    this.selectionManager.setActiveCell(cell);
    this.updateState({ activeCell: cell });
  }

  // --- Step 6: Import Execution ---

  public async import(): Promise<ImportResult> {
    this.updateState({
      currentStep: 'importing',
      isLoading: true,
      loadingMessage: 'Importing data...'
    });

    this.events.emit('importStarted', { totalRows: this.state.rows.length });

    try {
      const result = await this.importEngine.executeImport(
        this.state.rows,
        this.state.rowIds,
        this.state.errors,
        this.state.warnings,
        (progress) => {
          this.updateState({ progress });
          this.events.emit('importProgress', progress);
        }
      );

      this.updateState({
        result,
        currentStep: 'result',
        isLoading: false,
        loadingMessage: null
      });

      this.events.emit('importCompleted', { result });
      this.options.onComplete?.(result);

      return result;
    } catch (err: any) {
      this.updateState({
        isLoading: false,
        loadingMessage: null
      });

      this.events.emit('importFailed', { error: err });
      throw err;
    }
  }

  public exportErrors(format: 'csv' | 'xlsx'): void {
    ErrorExporter.download(
      format,
      this.state.errors,
      this.state.rows,
      this.state.rowIds,
      `import-errors-${this.state.fileName || 'file'}`
    );
    this.events.emit('errorExported', {
      format,
      count: Object.keys(this.state.errors).length
    });
  }

  public reset(): void {
    this.historyManager.clear();
    this.selectionManager.clearSelection();
    this.state = this.getInitialState();
    this.updateState(this.state);
    this.events.emit('reset', undefined);
  }

  public destroy(): void {
    this.subscribers.clear();
    this.events.clear();
    this.historyManager.clear();
    this.selectionManager.clearSelection();
  }
}
