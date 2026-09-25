# Data Transformation Engine

The transformation engine sanitizes and converts raw input data before validation, spreadsheet editing, and submission.

## Built-In Transformers

Data Importer provides standard transformers via `builtInTransformers`:

```ts
import { builtInTransformers } from 'data-importer';
```

| Transformer | Description | Example Input → Output |
|---|---|---|
| `trim()` | Strips leading and trailing whitespace | `"  hello  "` → `"hello"` |
| `uppercase()` | Converts string to uppercase | `"abc"` → `"ABC"` |
| `lowercase()` | Converts string to lowercase | `"USER@TEST.COM"` → `"user@test.com"` |
| `capitalize()` | Capitalizes each word | `"john doe"` → `"John Doe"` |
| `removeWhitespace()` | Removes all internal spaces | `"A B  C"` → `"ABC"` |
| `stringToNumber()` | Strips currency symbols & commas, parses number | `" $1,250.50 "` → `1250.5` |
| `stringToBoolean()` | Converts `'yes'`, `'true'`, `'1'` to boolean | `"yes"` → `true` |
| `stringToDate()` | Parses date string to ISO date string | `"2024-05-12"` → ISO string |
| `normalizeDate(fmt)` | Formats date into standard YYYY-MM-DD | `"05/12/2024"` → `"2024-05-12"` |

## Chaining Transformation Pipelines

Transformers can be chained sequentially in `column.transformers`:

```ts
{
  key: 'account_name',
  label: 'Account Name',
  type: 'string',
  transformers: [
    builtInTransformers.trim(),
    builtInTransformers.capitalize(),
    {
      name: 'prefix_account',
      transform: (val) => `ACC-${val}`
    }
  ]
}
```

## Custom Transformer Signature

```ts
type TransformFn = (
  value: unknown,
  row: Record<string, unknown>,
  context: { field: string; rowIndex: number }
) => unknown;
```
