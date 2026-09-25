/**
 * Data Importer - Core Type Definitions
 * Framework-agnostic, generic, strongly typed definitions
 */

export type ColumnType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'enum'
  | string;

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  rowId: string;
  field: string;
  code: string;
  message: string;
  severity: ValidationSeverity;
  value?: unknown;
}

export interface ValidationContext {
  schema: ImporterSchema;
  rows: Record<string, unknown>[];
  field: string;
  rowIndex: number;
}

export type SyncValidatorFn = (
  value: unknown,
  row: Record<string, unknown>,
  context: ValidationContext
) => ValidationError | ValidationError[] | null | undefined | boolean | string;

export type AsyncValidatorFn = (
  value: unknown,
  row: Record<string, unknown>,
  context: ValidationContext
) => Promise<ValidationError | ValidationError[] | null | undefined | boolean | string>;

export interface ValidationRule {
  name: string;
  validator: SyncValidatorFn | AsyncValidatorFn;
  isAsync?: boolean;
  message?: string;
  severity?: ValidationSeverity;
}

export type TransformFn = (
  value: unknown,
  row: Record<string, unknown>,
  context: { field: string; rowIndex: number }
) => unknown;

export interface TransformRule {
  name: string;
  transform: TransformFn;
}

export interface DuplicateRuleConfig {
  compositeFields?: string[];
  strategy?: 'reject' | 'keep-first' | 'keep-last' | 'allow-warning';
  customCheck?: (
    row: Record<string, unknown>,
    allRows: Record<string, unknown>[]
  ) => boolean | Promise<boolean>;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  description?: string;
  type: ColumnType;
  required?: boolean;
  nullable?: boolean;
  defaultValue?: unknown;
  aliases?: string[];
  validators?: ValidationRule[];
  transformers?: TransformRule[];
  unique?: boolean;
  duplicate?: DuplicateRuleConfig;
  options?: { label: string; value: unknown }[];
  display?: (value: unknown, row: Record<string, unknown>) => string;
  editable?: boolean | ((row: Record<string, unknown>) => boolean);
  width?: number;
  pinned?: 'left' | 'right';
  hidden?: boolean;
}

export type ImporterSchema = ColumnDefinition[];

export type MappingStrategy =
  | 'exact'
  | 'case-insensitive'
  | 'trimmed'
  | 'normalized'
  | 'alias'
  | 'fuzzy'
  | 'manual';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  strategy: MappingStrategy;
  sampleValues?: unknown[];
}

export type MappingStatus = 'mapped' | 'unmapped' | 'ambiguous' | 'low-confidence';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface FilterGroup {
  condition: 'AND' | 'OR';
  rules: (FilterRule | FilterGroup)[];
}

export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  field: string;
  direction: SortDirection;
}

export interface SheetInfo {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  sampleRows?: Record<string, unknown>[];
}

export interface ParsedData {
  sheets: SheetInfo[];
  selectedSheetId: string;
  headers: string[];
  rawRows: Record<string, unknown>[];
  totalRawRows: number;
}

export interface GridCellPosition {
  rowIndex: number;
  field: string;
}

export interface GridCellRange {
  startRow: number;
  endRow: number;
  startField: string;
  endField: string;
}

export interface ImportProgress {
  processed: number;
  total: number;
  percentage: number;
  successCount: number;
  failureCount: number;
}

export interface ImportRowResult {
  rowId: string;
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  importedRows: number;
  failedRows: number;
  duration: number;
  errors?: ValidationError[];
  rowResults?: ImportRowResult[];
}

export interface ImportStatistics {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  duplicates: number;
  empty: number;
  imported: number;
  failed: number;
}

export type StepState =
  | 'upload'
  | 'sheet-select'
  | 'mapping'
  | 'review'
  | 'importing'
  | 'result';

export interface ImporterState {
  currentStep: StepState;
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  sheets: SheetInfo[];
  selectedSheetId: string | null;
  sourceHeaders: string[];
  mappings: ColumnMapping[];
  unmappedHeaders: string[];
  rows: Record<string, unknown>[];
  rowIds: string[];
  originalRows: Record<string, unknown>[];
  errors: Record<string, ValidationError[]>; // keyed by `${rowId}:${field}` or rowId
  rowErrors: Record<string, ValidationError[]>; // keyed by rowId
  warnings: Record<string, ValidationError[]>;
  duplicates: Set<string>; // set of rowIds flagged as duplicate
  statistics: ImportStatistics;
  filters: FilterGroup | null;
  searchQuery: string;
  sorting: SortRule[];
  selectedRowIds: Set<string>;
  activeCell: GridCellPosition | null;
  selectedRange: GridCellRange | null;
  hiddenColumns: Set<string>;
  columnWidths: Record<string, number>;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
  progress: ImportProgress | null;
  result: ImportResult | null;
}

export interface ImporterEvents {
  fileSelected: { file: File };
  fileParsed: { sheets: SheetInfo[]; headers: string[]; rowCount: number };
  sheetSelected: { sheetId: string };
  mappingStarted: void;
  mappingCompleted: { mappings: ColumnMapping[] };
  mappingChanged: { mapping: ColumnMapping };
  transformationStarted: void;
  transformationCompleted: { rowCount: number };
  validationStarted: void;
  validationCompleted: { validCount: number; errorCount: number; warningCount: number };
  duplicateDetectionCompleted: { duplicateCount: number };
  rowUpdated: { rowId: string; field: string; oldValue: unknown; newValue: unknown };
  rowsUpdated: { rowIds: string[]; changes: Record<string, unknown> };
  rowsDeleted: { rowIds: string[] };
  rowsAdded: { rows: Record<string, unknown>[] };
  importStarted: { totalRows: number };
  importProgress: ImportProgress;
  importCompleted: { result: ImportResult };
  importFailed: { error: Error };
  errorExported: { format: 'csv' | 'xlsx'; count: number };
  reset: void;
  stateChanged: { state: ImporterState };
}

export interface ImporterOptions {
  schema: ImporterSchema;
  acceptedFiles?: ('csv' | 'tsv' | 'xls' | 'xlsx' | string)[];
  maxFileSize?: number; // bytes, default 50MB
  allowImportWithErrors?: boolean;
  allowImportWithWarnings?: boolean;
  batchSize?: number;
  autoMapThreshold?: number; // 0-1 confidence default 0.6
  checkDuplicate?: (row: Record<string, unknown>) => boolean | Promise<boolean>;
  onImport?: (
    rows: Record<string, unknown>[],
    progressCallback: (progress: ImportProgress) => void
  ) => Promise<ImportResult | ImportRowResult[] | void>;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
  observability?: {
    onTiming?: (metric: string, durationMs: number) => void;
  };
}

export interface ThemeConfig {
  primary?: string;
  primaryHover?: string;
  background?: string;
  surface?: string;
  surfaceSecondary?: string;
  border?: string;
  text?: string;
  textSecondary?: string;
  muted?: string;
  success?: string;
  warning?: string;
  error?: string;
  focus?: string;
  radiusSm?: string;
  radiusMd?: string;
  radiusLg?: string;
  fontFamily?: string;
}

export interface ComponentOverrides {
  Header?: React.ComponentType<{ state: ImporterState; onReset: () => void }>;
  UploadZone?: React.ComponentType<{ onFileSelect: (file: File) => void; error?: string }>;
  MappingPanel?: React.ComponentType<{
    mappings: ColumnMapping[];
    schema: ImporterSchema;
    onUpdateMapping: (source: string, target: string | null) => void;
    onAutoMap: () => void;
  }>;
  Grid?: React.ComponentType<any>;
  ErrorPanel?: React.ComponentType<{
    errors: Record<string, ValidationError[]>;
    onSelectCell: (rowId: string, field: string) => void;
  }>;
  ResultView?: React.ComponentType<{
    result: ImportResult;
    onReset: () => void;
  }>;
}
