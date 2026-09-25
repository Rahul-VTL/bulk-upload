# Schema Specification

The schema is the central contract defining how columns are parsed, mapped, transformed, validated, and presented.

## Schema Structure

A schema is an array of `ColumnDefinition` objects:

```ts
type ImporterSchema = ColumnDefinition[];
```

## `ColumnDefinition` Properties

| Property | Type | Description |
|---|---|---|
| `key` | `string` | **Required**. Unique identifier for the field in clean output objects. |
| `label` | `string` | **Required**. Human-readable label displayed in table headers and mapping dropdowns. |
| `type` | `ColumnType` | Data type: `'string' \| 'number' \| 'integer' \| 'boolean' \| 'date' \| 'datetime' \| 'email' \| 'phone' \| 'enum'`. |
| `description` | `string` | Optional contextual help text for tooltips. |
| `required` | `boolean` | If `true`, empty cells trigger a `REQUIRED` validation error and must be mapped. |
| `nullable` | `boolean` | If `true`, allows null values even if type validation is present. |
| `defaultValue` | `unknown` | Value used when source row does not supply a cell value. |
| `aliases` | `string[]` | Alternative header names matched with high confidence during auto-mapping. |
| `validators` | `ValidationRule[]` | List of custom synchronous or asynchronous validation rules. |
| `transformers` | `TransformRule[]` | List of transformation functions applied before validation and display. |
| `unique` | `boolean` | If `true`, flags duplicate values across the dataset. |
| `duplicate` | `DuplicateRuleConfig` | Advanced composite-field deduplication configuration. |
| `options` | `Array<{ label, value }>` | Allowed values when `type: 'enum'`. |
| `display` | `(value, row) => string` | Custom cell formatting function for display purposes. |
| `editable` | `boolean \| ((row) => boolean)` | Controls whether users can edit the cell in the spreadsheet grid. |

## Example Schema

```ts
import { ImporterSchema, builtInValidators, builtInTransformers } from 'data-importer';

export const productSchema: ImporterSchema = [
  {
    key: 'sku',
    label: 'SKU Code',
    type: 'string',
    required: true,
    unique: true,
    aliases: ['item_code', 'product_code', 'part_number']
  },
  {
    key: 'name',
    label: 'Product Name',
    type: 'string',
    required: true,
    transformers: [builtInTransformers.trim(), builtInTransformers.capitalize()]
  },
  {
    key: 'price',
    label: 'Unit Price ($)',
    type: 'number',
    required: true,
    validators: [builtInValidators.min(0.01, 'Price must be greater than zero')]
  },
  {
    key: 'status',
    label: 'Catalog Status',
    type: 'enum',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Draft', value: 'draft' },
      { label: 'Archived', value: 'archived' }
    ]
  }
];
```
