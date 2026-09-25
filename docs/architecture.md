# Architecture & Design Boundaries

Data Importer is built using a strict layered architecture designed to ensure framework independence, high maintainability, and total decoupling from application concerns.

```
                 DATA IMPORTER
                       │
        ┌──────────────┴──────────────┐
        │                             │
       CORE                           UI
        │                             │
 ┌──────┼─────────┐           ┌───────┼────────┐
 │      │         │           │       │        │
Parser Mapper Validator     React   WebComp  Future
Transform Duplicate          UI      UI      Adapters
Grid State
Import Engine
```

## Architectural Tenets

### 1. Zero Framework Leakage in Core
The `packages/data-importer` core engine:
- Never imports React, Angular, Vue, or Svelte.
- Never imports Redux, Zustand, or framework state managers.
- Never touches the browser DOM directly in core pipeline methods.
- Operates identically inside Node.js, Web Workers, or browser runtime environments.

### 2. Clear Responsibility Separation

| Subsystem | Owner | Purpose |
|---|---|---|
| **API & Network** | Consuming Application | Application endpoints, authentication tokens, rate limits, session cookies. |
| **Domain Logic** | Consuming Application | Business rules, authorization, database constraints, user roles. |
| **Data Engine** | Data Importer | Parsing, header detection, column mapping, field validation, transforms, deduplication, spreadsheet editing, undo/redo. |
| **Presentation** | Data Importer / React | Virtualized rendering, accessibility, design tokens, focus management, user workflow steps. |

### 3. Pipeline Workflow

```
UPLOAD
   ↓
FILE VALIDATION (Extension, MIME, Size, Non-empty)
   ↓
PARSER (RFC-4180 CSV / TSV / SheetJS XLSX)
   ↓
SHEET SELECTION (If multi-sheet workbook)
   ↓
HEADER DETECTION (Heuristic confidence scoring)
   ↓
COLUMN MAPPING (Exact, Alias, Normalized, Fuzzy)
   ↓
TRANSFORMATION (Built-in string/date/number & Custom)
   ↓
VALIDATION (Synchronous, Asynchronous, Cross-field)
   ↓
DUPLICATE DETECTION (Single & composite keys, keep-first/last/reject)
   ↓
EDITABLE SPREADSHEET (Virtualized grid, undo/redo, sorting, filtering)
   ↓
REVIEW & IMPORT (Progress callback & error handling)
   ↓
RESULT
```

### 4. Memory & Performance Optimizations
- **No Full Clones on Edit**: Changes are stored as lightweight atomic patches in `HistoryManager`, enabling instant undo/redo without duplicating 50,000-row arrays.
- **Row Virtualization**: The grid only mounts visible rows plus overscan buffer, keeping DOM nodes minimal and scroll frame rates at 60fps.
- **Stable References**: Pure functions and memoized selectors avoid cascade re-rendering.
