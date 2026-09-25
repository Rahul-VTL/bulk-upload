import { FilterGroup, FilterOperator, FilterRule } from '../../types';

export class FilterEngine {
  /**
   * Filters rows based on a FilterGroup (supports AND/OR and nested groups)
   */
  filterRows(
    rows: Record<string, unknown>[],
    rowIds: string[],
    filterGroup: FilterGroup | null,
    searchQuery = ''
  ): { filteredRows: Record<string, unknown>[]; filteredRowIds: string[]; indices: number[] } {
    const hasGroup = filterGroup && filterGroup.rules.length > 0;
    const hasSearch = searchQuery.trim().length > 0;

    if (!hasGroup && !hasSearch) {
      return {
        filteredRows: rows,
        filteredRowIds: rowIds,
        indices: rows.map((_, i) => i)
      };
    }

    const filteredRows: Record<string, unknown>[] = [];
    const filteredRowIds: string[] = [];
    const indices: number[] = [];

    const searchLower = searchQuery.toLowerCase().trim();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Global search check
      if (hasSearch) {
        const matchesSearch = Object.values(row).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) continue;
      }

      // FilterGroup check
      if (hasGroup) {
        const matchesFilter = this.evaluateGroup(row, filterGroup!);
        if (!matchesFilter) continue;
      }

      filteredRows.push(row);
      filteredRowIds.push(rowIds[i]);
      indices.push(i);
    }

    return { filteredRows, filteredRowIds, indices };
  }

  evaluateGroup(row: Record<string, unknown>, group: FilterGroup): boolean {
    if (!group.rules || group.rules.length === 0) return true;

    if (group.condition === 'OR') {
      return group.rules.some((rule) => {
        if ('condition' in rule) {
          return this.evaluateGroup(row, rule as FilterGroup);
        }
        return this.evaluateRule(row, rule as FilterRule);
      });
    }

    // AND condition
    return group.rules.every((rule) => {
      if ('condition' in rule) {
        return this.evaluateGroup(row, rule as FilterGroup);
      }
      return this.evaluateRule(row, rule as FilterRule);
    });
  }

  evaluateRule(row: Record<string, unknown>, rule: FilterRule): boolean {
    const rawVal = row[rule.field];
    const op = rule.operator;
    const targetVal = rule.value;

    const isEmptyVal = rawVal === null || rawVal === undefined || String(rawVal).trim() === '';

    if (op === 'isEmpty') return isEmptyVal;
    if (op === 'isNotEmpty') return !isEmptyVal;

    if (isEmptyVal && op !== 'notEquals' && op !== 'notContains') {
      return false;
    }

    const strVal = String(rawVal ?? '').toLowerCase();
    const strTarget = String(targetVal ?? '').toLowerCase();

    switch (op) {
      case 'equals':
        return String(rawVal) === String(targetVal);

      case 'notEquals':
        return String(rawVal) !== String(targetVal);

      case 'contains':
        return strVal.includes(strTarget);

      case 'notContains':
        return !strVal.includes(strTarget);

      case 'startsWith':
        return strVal.startsWith(strTarget);

      case 'endsWith':
        return strVal.endsWith(strTarget);

      case 'greaterThan':
        return Number(rawVal) > Number(targetVal);

      case 'greaterThanOrEqual':
        return Number(rawVal) >= Number(targetVal);

      case 'lessThan':
        return Number(rawVal) < Number(targetVal);

      case 'lessThanOrEqual':
        return Number(rawVal) <= Number(targetVal);

      default:
        return true;
    }
  }
}
