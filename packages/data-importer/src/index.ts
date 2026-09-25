/**
 * Data Importer - Core Headless Engine
 * Framework-agnostic, generic, zero-dependency on UI frameworks
 */

export * from './types';
export * from './core/errors';
export * from './core/events/event-emitter';
export * from './core/importer/data-importer';
export * from './core/importer/create-importer';

// Parsers
export * from './parser/parser.types';
export * from './parser/file-validator';
export * from './parser/header-detector';
export * from './parser/parser-registry';
export * from './parser/csv/csv-parser';
export * from './parser/tsv/tsv-parser';
export * from './parser/xlsx/xlsx-parser';

// Mapping
export * from './mapper/fuzzy/string-similarity';
export * from './mapper/mapping-engine';

// Transformers
export * from './transformer/built-in';
export * from './transformer/transformer-engine';

// Validators
export * from './validator/built-in';
export * from './validator/validation-engine';

// Duplicate detection
export * from './duplicate/duplicate-engine';

// Grid helpers
export * from './grid/filtering/filter-engine';
export * from './grid/sorting/sort-engine';
export * from './grid/selection/selection-manager';
export * from './grid/history/history-manager';

// Importer & Exporter
export * from './importer/import-engine';
export * from './importer/error-exporter';

// Web Component
export * from './web-component';
