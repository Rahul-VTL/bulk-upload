# Global Auto-Shimmer & Skeleton System

A zero-configuration, automated structural skeleton and shimmer loader system for React.

Instead of handcrafting dozens of one-off skeleton components (`UserTableSkeleton.tsx`, `ExamCardSkeleton.tsx`, `DashboardSkeleton.tsx`), `<AutoShimmer>` inspects the rendered DOM layout of your real component and automatically overlays an animated, pixel-perfect skeleton matching all titles, badges, inputs, buttons, and cards.

---

## 🚀 Key Highlights

- **Pixel-for-Pixel Structure Preservation**: Automatically derives shimmer blocks from the real layout and respects existing CSS (headings, grid/flex layouts, border-radii, responsive breakpoints).
- **Zero Layout Shifts**: When `loading={false}`, renders the original component directly without any extra wrapping `div`s, layout alterations, or style overrides.
- **Dynamic Data Support (`templateProps`)**: Solves empty tables/lists during loading by injecting mock/template rows so the shimmer has real rows to measure.
- **Enterprise-Grade Safety**: Integrated `AutoShimmerErrorBoundary` guarantees DOM measurement issues never crash the host application.
- **Accessible Out-of-the-Box**: Includes `role="status"`, `aria-busy="true"`, and `aria-live="polite"` for screen readers.
- **Anti-Flicker Timing**: Configurable `delay` (bypasses shimmer for fast/cached API responses) and `minimumDuration` (prevents sub-100ms flash of skeleton).

---

## 📦 Architecture & Directory Structure

```
apps/playground/src/
├── components/
│   └── ui/
│       └── AutoShimmer/
│           ├── AutoShimmer.tsx          # Main component wrapper with ErrorBoundary & timing
│           ├── AutoShimmer.types.ts      # TypeScript interfaces and prop types
│           ├── AutoShimmer.constants.ts  # Design tokens and defaults
│           ├── AutoShimmer.utils.ts      # SSR guards, ErrorBoundary, delay timers
│           └── index.ts                 # Clean public export barrel
│
├── hooks/
│   └── useAutoShimmer.ts                # Custom hook for loading state & template props
```

---

## 🛠️ Installation & Underlying Library

This system leverages `@shimmer-from-structure/react` (`2.4.6`):

```bash
pnpm add @shimmer-from-structure/react
```

---

## 📖 API Reference

### `<AutoShimmer />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `loading` *(required)* | `boolean` | — | When `true`, displays automated structural shimmer. When `false`, renders child component directly. |
| `children` *(required)* | `React.ReactNode` | — | Target component to measure and render. |
| `templateProps` | `Record<string, unknown>` | `undefined` | Mock props injected into the first child during loading (e.g. mock rows for empty tables). |
| `duration` | `number` | `1.5` | Shimmer wave animation cycle in seconds. |
| `baseColor` | `string` | `"#e2e8f0"` | Background color for skeleton placeholders. |
| `highlightColor` | `string` | `"rgba(255, 255, 255, 0.65)"` | Highlight gradient color for the shimmer wave. |
| `borderRadius` | `number` | `6` | Fallback border radius (px) for elements lacking an explicit CSS `border-radius`. |
| `delay` | `number` | `0` | Delay in ms before showing shimmer (prevents flicker on fast network responses). |
| `minimumDuration` | `number` | `0` | Minimum ms shimmer remains visible once shown (avoids jarring 50ms flashes). |
| `disabled` | `boolean` | `false` | When `true`, completely bypasses shimmer effect. |
| `fallback` | `React.ReactNode` | `undefined` | Custom fallback UI if DOM measurement fails. |
| `ariaLabel` | `string` | `"Loading content, please wait..."` | Accessibility announcement for assistive technology. |
| `className` | `string` | `""` | Optional CSS class applied to the shimmer wrapper container. |
| `style` | `React.CSSProperties` | `undefined` | Optional inline styles applied to the shimmer container. |

---

## 💡 Usage Examples

### 1. Basic Usage (Dashboard, Cards, Forms)

```tsx
import { AutoShimmer } from '@/components/ui/AutoShimmer';

export const DashboardView = () => {
  const { data, isLoading } = useDashboardQuery();

  return (
    <AutoShimmer loading={isLoading}>
      <ObserverDashboard data={data} />
    </AutoShimmer>
  );
};
```

---

### 2. Dynamic Tables & Lists with `templateProps`

When a table or list depends on API data, the `data` array may be empty `[]` while loading. Use `templateProps` to supply representative placeholder records so the shimmer has rows to measure:

```tsx
import { AutoShimmer } from '@/components/ui/AutoShimmer';

const MOCK_ROWS = [
  { id: '1', name: 'Placeholder', email: 'user@domain.com', role: 'Staff' },
  { id: '2', name: 'Placeholder', email: 'user@domain.com', role: 'Staff' },
  { id: '3', name: 'Placeholder', email: 'user@domain.com', role: 'Staff' },
  { id: '4', name: 'Placeholder', email: 'user@domain.com', role: 'Staff' },
];

export const UsersPage = () => {
  const { users, isLoading } = useUsers();

  return (
    <AutoShimmer
      loading={isLoading}
      templateProps={{ users: MOCK_ROWS }}
    >
      <UserTable users={users} />
    </AutoShimmer>
  );
};
```

---

### 3. Anti-Flicker Timing (`delay` & `minimumDuration`)

Prevent flashes of skeleton states for lightning-fast or pre-cached requests:

```tsx
<AutoShimmer
  loading={isLoading}
  delay={200}             // Don't show shimmer if request finishes within 200ms
  minimumDuration={500}   // If shimmer appears, keep it visible for at least 500ms
>
  <ExamScheduleDetails />
</AutoShimmer>
```

---

### 4. Convenient Hook (`useAutoShimmer`)

```tsx
import { useAutoShimmer } from '@/hooks/useAutoShimmer';
import { AutoShimmer } from '@/components/ui/AutoShimmer';

export const ProfileSection = () => {
  const { profile, isFetching } = useProfile();

  const { shimmerProps } = useAutoShimmer(isFetching, {
    delay: 150,
    minimumDuration: 400
  });

  return (
    <AutoShimmer {...shimmerProps}>
      <UserProfileCard profile={profile} />
    </AutoShimmer>
  );
};
```

---

## ♿ Accessibility (A11y)

- When `loading={true}`, the container is marked with `role="status"`, `aria-busy="true"`, and `aria-live="polite"`.
- The measurement container is hidden from assistive technologies using `aria-hidden="true"`.
- Interactive elements inside the measured tree have `pointerEvents: "none"` while loading to prevent accidental clicks.
- When `loading={false}`, all accessibility attributes and containers are completely removed, preserving native keyboard navigation and semantics pixel-for-pixel.
