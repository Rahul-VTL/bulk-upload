# Validation Engine

The validation engine guarantees clean, reliable data before records can be submitted to your application backend.

## Built-In Validators

```ts
import { builtInValidators } from 'data-importer';
```

| Validator | Purpose | Example |
|---|---|---|
| `required(msg?, severity?)` | Verifies non-empty cell | `builtInValidators.required('Field cannot be empty')` |
| `email(msg?, severity?)` | RFC compliant email format | `builtInValidators.email()` |
| `phone(msg?, severity?)` | Standard international telephone numbers | `builtInValidators.phone()` |
| `number(msg?, severity?)` | Valid float or numeric value | `builtInValidators.number()` |
| `integer(msg?, severity?)` | Valid integer check | `builtInValidators.integer()` |
| `date(msg?, severity?)` | Valid parseable date | `builtInValidators.date()` |
| `min(limit, msg?, severity?)` | Minimum numeric bound | `builtInValidators.min(0)` |
| `max(limit, msg?, severity?)` | Maximum numeric bound | `builtInValidators.max(100)` |
| `minLength(len, msg?, severity?)` | Minimum string character length | `builtInValidators.minLength(3)` |
| `maxLength(len, msg?, severity?)` | Maximum string character length | `builtInValidators.maxLength(50)` |
| `regex(regex, msg?, severity?)` | Custom regular expression matching | `builtInValidators.regex(/^[A-Z]{3}-\\d+$/)` |
| `enum(allowed, msg?, severity?)` | Restricts value to allowed options | `builtInValidators.enum(['Active', 'Pending'])` |

## Severity Levels

Issues can have one of three severities:
- `'error'`: Blocks import unless `allowImportWithErrors: true` is configured.
- `'warning'`: Displayed in amber. Allowed by default.
- `'info'`: Non-blocking informational notice.

## Cross-Field Validation

Validators receive the entire current `row` and context array, enabling comparisons across sibling fields:

```ts
{
  key: 'endDate',
  label: 'End Date',
  type: 'date',
  validators: [
    {
      name: 'date_order',
      validator: (value, row) => {
        if (row.startDate && value && new Date(value as string) < new Date(row.startDate as string)) {
          return 'End date cannot be prior to start date';
        }
        return null;
      }
    }
  ]
}
```

## Asynchronous Validation

Async validators enable checking external databases or APIs (e.g. checking if a username is available or validating an address with a lookup service):

```ts
{
  key: 'sku',
  label: 'SKU',
  type: 'string',
  validators: [
    {
      name: 'check_sku_exists',
      isAsync: true,
      validator: async (value) => {
        const exists = await myApplicationApi.checkSkuExists(value);
        if (exists) {
          return 'SKU is already registered in inventory';
        }
        return null;
      }
    }
  ]
}
```
