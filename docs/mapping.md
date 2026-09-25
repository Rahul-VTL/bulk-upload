# Column Mapping Engine

Data Importer includes an intelligent mapping engine that pairs uploaded file headers with target schema fields using 6 distinct strategies and calculates confidence scores (0.0 to 1.0).

## Mapping Strategies

1. **Exact (`confidence: 1.0`)**: Direct case-sensitive equality with `column.key` or `column.label`.
2. **Case-Insensitive / Trimmed (`confidence: 0.98`)**: Equality after trimming whitespace and ignoring casing.
3. **Alias Matching (`confidence: 0.95`)**: Matches user-defined aliases configured in the schema:
   ```ts
   {
     key: 'email',
     label: 'Email',
     aliases: ['work_email', 'e-mail', 'mail_address', 'contact_email']
   }
   ```
4. **Normalized Matching (`confidence: 0.90`)**: Compares characters after removing all spaces, dashes, underscores, and punctuation (e.g., `"Email Address"` matches `"email_address"` or `"EmailAddress"`).
5. **Fuzzy Matching (`confidence: 0.60 - 0.89`)**: Combines Levenshtein string distance with trigram ngram similarity to detect typos (e.g. `"phne_num"` matches `"phone_number"`).
6. **Manual**: When user manually assigns or alters a column mapping in the UI.

## Mapping Statuses

- **Mapped**: Column is matched to a target field with confidence above `autoMapThreshold` (default `0.6`).
- **Unmapped**: Column is unassigned or ignored (`targetField: null`).
- **Low Confidence**: Matched with confidence below `0.75`. Highlighted for user verification.
- **Ambiguous**: Multiple fields matched with similar scores.

## Auto-Map Configuration

```ts
<DataImporter
  schema={schema}
  autoMapThreshold={0.65}
/>
```
