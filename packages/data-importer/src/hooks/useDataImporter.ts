import { useEffect, useRef, useState, useMemo } from 'react';
import { DataImporterCore } from '../core/importer/data-importer';
import { createImporter } from '../core/importer/create-importer';
import { ImporterOptions, ImporterState } from '../types';

export function useDataImporter(options: ImporterOptions) {
  // Keep options ref updated without causing re-instantiation
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const importer = useMemo(() => {
    return createImporter(optionsRef.current);
  }, []); // single stable instance per hook lifecycle

  const [state, setState] = useState<ImporterState>(() => importer.getState());

  useEffect(() => {
    const unsubscribe = importer.subscribe((nextState) => {
      setState(nextState);
    });

    return () => {
      unsubscribe();
      importer.destroy();
    };
  }, [importer]);

  return {
    importer,
    state,
    loadFile: (file: File) => importer.loadFile(file),
    selectSheet: (sheetId: string) => importer.selectSheet(sheetId),
    setMapping: (source: string, target: string | null) => importer.setMapping(source, target),
    autoMap: () => importer.autoMap(),
    confirmMappingAndPrepare: () => importer.confirmMappingAndPrepare(),
    updateCell: (rowId: string, field: string, val: unknown) => importer.updateCell(rowId, field, val),
    updateCells: (changes: Array<{ rowId: string; field: string; value: unknown }>) =>
      importer.updateCells(changes),
    addRow: (row?: Record<string, unknown>, atIndex?: number) => importer.addRow(row, atIndex),
    deleteRows: (rowIds: string[]) => importer.deleteRows(rowIds),
    duplicateRow: (rowId: string) => importer.duplicateRow(rowId),
    undo: () => importer.undo(),
    redo: () => importer.redo(),
    setFilter: (f: import('../types').FilterGroup | null) => importer.setFilter(f),
    setSearch: (q: string) => importer.setSearch(q),
    setSorting: (s: import('../types').SortRule[]) => importer.setSorting(s),
    toggleRowSelection: (rowId: string, force?: boolean) => importer.toggleRowSelection(rowId, force),
    selectAllRows: () => importer.selectAllRows(),
    clearSelection: () => importer.clearSelection(),
    exportErrors: (format: 'csv' | 'xlsx') => importer.exportErrors(format),
    validate: () => importer.validate(),
    import: () => importer.import(),
    reset: () => importer.reset()
  };
}
