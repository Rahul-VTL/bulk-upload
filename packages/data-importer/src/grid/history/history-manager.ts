export type HistoryAction =
  | {
      type: 'cell_update';
      rowId: string;
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }
  | {
      type: 'bulk_cell_update';
      changes: Array<{
        rowId: string;
        field: string;
        oldValue: unknown;
        newValue: unknown;
      }>;
    }
  | {
      type: 'rows_added';
      rows: Array<{ index: number; rowId: string; data: Record<string, unknown> }>;
    }
  | {
      type: 'rows_deleted';
      rows: Array<{ index: number; rowId: string; data: Record<string, unknown> }>;
    };

export class HistoryManager {
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  push(action: HistoryAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
    // Clear redo stack upon new user action
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  popUndo(): HistoryAction | undefined {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action;
  }

  popRedo(): HistoryAction | undefined {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
    }
    return action;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
