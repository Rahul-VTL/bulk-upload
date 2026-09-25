import { GridCellPosition, GridCellRange } from '../../types';

export class SelectionManager {
  private selectedRowIds = new Set<string>();
  private activeCell: GridCellPosition | null = null;
  private selectedRange: GridCellRange | null = null;

  getSelectedRowIds(): Set<string> {
    return new Set(this.selectedRowIds);
  }

  isRowSelected(rowId: string): boolean {
    return this.selectedRowIds.has(rowId);
  }

  toggleRow(rowId: string, force?: boolean): void {
    const shouldSelect = force !== undefined ? force : !this.selectedRowIds.has(rowId);
    if (shouldSelect) {
      this.selectedRowIds.add(rowId);
    } else {
      this.selectedRowIds.delete(rowId);
    }
  }

  selectRows(rowIds: string[]): void {
    for (const id of rowIds) {
      this.selectedRowIds.add(id);
    }
  }

  deselectRows(rowIds: string[]): void {
    for (const id of rowIds) {
      this.selectedRowIds.delete(id);
    }
  }

  selectAll(allRowIds: string[]): void {
    this.selectedRowIds = new Set(allRowIds);
  }

  clearSelection(): void {
    this.selectedRowIds.clear();
    this.selectedRange = null;
  }

  getActiveCell(): GridCellPosition | null {
    return this.activeCell;
  }

  setActiveCell(cell: GridCellPosition | null): void {
    this.activeCell = cell;
  }

  getSelectedRange(): GridCellRange | null {
    return this.selectedRange;
  }

  setSelectedRange(range: GridCellRange | null): void {
    this.selectedRange = range;
  }
}
