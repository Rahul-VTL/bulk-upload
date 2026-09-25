# Filtering, Searching & Sorting

Data Importer provides advanced query and organizational capabilities directly in the spreadsheet view.

## 1. Global Search

The toolbar includes a fast, case-insensitive global search bar. It matches across all visible columns and updates the display in real-time.

```ts
importer.setSearch('electronics');
```

## 2. Advanced Multi-Condition Filtering

The filter modal supports nested AND / OR condition groups and 12 relational operators:

### Operators
- `equals`: Exact string or value equality.
- `notEquals`: Inequality.
- `contains`: Substring match.
- `notContains`: Excludes substring.
- `startsWith`: Prefix matching.
- `endsWith`: Suffix matching.
- `greaterThan`: Numeric greater than (`>`).
- `greaterThanOrEqual`: Numeric greater than or equal (`>=`).
- `lessThan`: Numeric less than (`<`).
- `lessThanOrEqual`: Numeric less than or equal (`<=`).
- `isEmpty`: Matches empty, null, or undefined cells.
- `isNotEmpty`: Matches non-empty cells.

### Filter Group Example

```ts
const filterGroup: FilterGroup = {
  condition: 'AND',
  rules: [
    { field: 'status', operator: 'equals', value: 'active' },
    { field: 'age', operator: 'greaterThanOrEqual', value: 21 }
  ]
};

importer.setFilter(filterGroup);
```

## 3. Multi-Column Stable Sorting

Columns can be sorted ascending or descending:

```ts
importer.setSorting([
  { field: 'category', direction: 'asc' },
  { field: 'price', direction: 'desc' }
]);
```

Sorting handles numeric values, dates, and strings accurately, and preserves relative row indices for equal values.
