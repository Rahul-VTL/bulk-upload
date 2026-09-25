import { SortRule } from '../../types';

export class SortEngine {
  /**
   * Sorts rows stably based on multi-column sort rules
   */
  sortRows(
    rows: Record<string, unknown>[],
    rowIds: string[],
    sortRules: SortRule[]
  ): { sortedRows: Record<string, unknown>[]; sortedRowIds: string[] } {
    if (!sortRules || sortRules.length === 0) {
      return { sortedRows: [...rows], sortedRowIds: [...rowIds] };
    }

    // Pair items with original index to ensure stable sort
    const items = rows.map((row, index) => ({
      row,
      rowId: rowIds[index],
      originalIndex: index
    }));

    items.sort((a, b) => {
      for (const rule of sortRules) {
        const field = rule.field;
        const dir = rule.direction === 'desc' ? -1 : 1;

        const valA = a.row[field];
        const valB = b.row[field];

        // Handle nulls / undefined
        if (valA === valB) continue;
        if (valA === null || valA === undefined || valA === '') return 1 * dir;
        if (valB === null || valB === undefined || valB === '') return -1 * dir;

        // Numeric comparison
        const numA = typeof valA === 'number' ? valA : Number(valA);
        const numB = typeof valB === 'number' ? valB : Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) {
            return (numA - numB) * dir;
          }
          continue;
        }

        // Date comparison
        const timeA = Date.parse(String(valA));
        const timeB = Date.parse(String(valB));
        if (!isNaN(timeA) && !isNaN(timeB)) {
          if (timeA !== timeB) {
            return (timeA - timeB) * dir;
          }
          continue;
        }

        // String comparison
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        const cmp = strA.localeCompare(strB);
        if (cmp !== 0) {
          return cmp * dir;
        }
      }

      // Preserve original relative order for stability
      return a.originalIndex - b.originalIndex;
    });

    return {
      sortedRows: items.map((it) => it.row),
      sortedRowIds: items.map((it) => it.rowId)
    };
  }
}
