# Testing Guide

Data Importer uses [Vitest](https://vitest.dev/) for fast, comprehensive automated unit and integration tests.

## Running Tests

From the monorepo root:

```bash
# Run all automated tests
pnpm test

# Run tests in watch mode
pnpm --filter data-importer test:watch
```

## Test Coverage Scope

The automated test suite verifies:
1. **File Validator**: Rejection of empty files, file size limits, unsupported extensions, valid CSV/XLSX recognition.
2. **CSV Parser**: Delimiter detection, quotes, escaped quotes `""`, newlines in quoted values, BOM stripping, Unicode and emojis.
3. **TSV Parser**: Tab-delimited record splitting and quote handling.
4. **Header Detector**: Confidence scoring, duplicate header disambiguation (`email`, `email_1`), missing header generation.
5. **Mapping Engine**: Exact matching, case-insensitive, aliases, normalized strings, fuzzy similarity algorithm.
6. **Transformer Engine**: Trim, uppercase, lowercase, capitalize, removeWhitespace, stringToNumber, stringToBoolean, normalizeDate, custom pipelines.
7. **Validation Engine**: Required, email, phone, number, integer, date, min/max bounds, enum, custom sync, custom async, and cross-field rules.
8. **Duplicate Detection**: Single field unique, composite multi-column keys, deduplication strategies (`keep-first`, `keep-last`, `reject`, `allow-warning`).
9. **Filtering Engine**: 12 operators, nested AND/OR condition groups, case-insensitive global search.
10. **Sorting Engine**: Multi-column stable sorting across strings, numbers, and dates.
11. **History Manager**: Patch-based undo/redo state preservation.
12. **End-to-End Importer Lifecycle**: Full sequence from file load to parsing, mapping, transforming, editing, undoing, and consumer API submission.
