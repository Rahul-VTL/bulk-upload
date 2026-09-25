# Duplicate Detection

Data Importer provides duplicate identification for both single fields and composite multi-field keys, with configurable strategies and external database check integration.

## Single Field Duplicates

To mark a field as unique across the uploaded dataset:

```ts
{
  key: 'email',
  label: 'Email',
  type: 'email',
  unique: true
}
```

## Composite Key Duplicates

When uniqueness is determined by multiple columns together (e.g. `firstName` + `lastName` or `sku` + `warehouse`):

```ts
{
  key: 'sku',
  label: 'SKU',
  type: 'string',
  duplicate: {
    compositeFields: ['sku', 'warehouse_code'],
    strategy: 'reject'
  }
}
```

## Deduplication Strategies

- `'keep-first'` (default): First occurrence is preserved as valid; subsequent duplicate records are flagged.
- `'keep-last'`: The final occurrence is treated as valid; previous occurrences are flagged.
- `'reject'`: All instances of the duplicated value are flagged.
- `'allow-warning'`: Duplicates are marked with severity `'warning'` rather than blocking errors.

## External Database Duplication Check

You can pass a consumer callback `checkDuplicate(row)` to verify records against existing records in your application database without exposing backend credentials to the library:

```tsx
<DataImporter
  schema={schema}
  checkDuplicate={async (row) => {
    // Calls your existing application API
    return await api.checkCustomerExists(row.email);
  }}
/>
```
