# Theming & Design Tokens

Data Importer uses CSS custom properties (variables) to enable seamless white-labeling, brand consistency, and dark mode support.

## Available CSS Variables

```css
:root {
  --di-primary: #2563eb;
  --di-primary-hover: #1d4ed8;
  --di-primary-light: #eff6ff;
  --di-background: #f8fafc;
  --di-surface: #ffffff;
  --di-surface-secondary: #f1f5f9;
  --di-border: #e2e8f0;
  --di-border-strong: #cbd5e1;
  --di-text: #0f172a;
  --di-text-secondary: #475569;
  --di-muted: #94a3b8;
  --di-success: #10b981;
  --di-success-light: #ecfdf5;
  --di-warning: #f59e0b;
  --di-warning-light: #fffbeb;
  --di-error: #ef4444;
  --di-error-light: #fef2f2;
  --di-focus: #3b82f6;
  --di-radius-sm: 4px;
  --di-radius-md: 8px;
  --di-radius-lg: 12px;
  --di-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

## Prop-Based Theming in React

You can pass a `theme` prop to `<DataImporter>`:

```tsx
<DataImporter
  schema={schema}
  theme={{
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    background: '#f5f3ff',
    surface: '#ffffff',
    border: '#e0e7ff',
    text: '#1e1b4b',
    radiusMd: '10px'
  }}
/>
```

## Dark Mode Theme Example

```tsx
<DataImporter
  schema={schema}
  theme={{
    primary: '#38bdf8',
    primaryHover: '#0ea5e9',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    border: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    muted: '#64748b'
  }}
/>
```
