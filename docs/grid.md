# Editable Spreadsheet Grid

The Data Importer spreadsheet editor provides a desktop-class editing experience built with original styling and high-performance virtualization.

## Key Interactions

- **Inline Editing**: Double-click any cell or press `Enter` to edit. Press `Enter` or `Tab` to commit changes, or `Escape` to cancel.
- **Keyboard Navigation**:
  - `Arrow Keys`: Move active focus cell up, down, left, right.
  - `Tab` / `Shift+Tab`: Traverse cells left-to-right, wrapping across rows.
  - `Enter`: Enter edit mode on active cell.
  - `Delete` / `Backspace`: Clear active cell contents.
  - `Ctrl+Z` / `Cmd+Z`: Undo previous action.
  - `Ctrl+Y` / `Cmd+Shift+Z`: Redo previous action.
- **Row Selection**: Checkboxes in the sticky row header allow selecting individual rows or clicking the header checkbox to select all.
- **Bulk Operations**:
  - **Bulk Edit**: Apply a single replacement value across all currently selected rows.
  - **Bulk Delete**: Delete multiple selected rows with one action.
  - **Add Row**: Append a new row with default schema values.
  - **Duplicate Row**: Clone a row for rapid entry.

## Error and Warning Indicators

- Cells containing errors display a red corner badge and error background tint.
- Cells with warnings display an amber corner badge.
- Hovering or focusing a flagged cell reveals the exact error message and code in a tooltip.
- Clicking quick filter tabs ("Errors Only", "Warnings Only", "Duplicates Only") instantly isolates problematic rows.

## Row Virtualization

The grid uses windowed virtualization:
- Only currently visible rows + a small overscan buffer (10 rows) are rendered in the DOM.
- Enables smooth 60fps scrolling across 10,000+ records with near-zero memory overhead.
