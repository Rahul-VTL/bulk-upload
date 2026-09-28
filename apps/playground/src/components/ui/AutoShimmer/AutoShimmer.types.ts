import React from 'react';

/**
 * Configuration options for the AutoShimmer component.
 */
export interface AutoShimmerProps {
  /**
   * When true, generates an automatic shimmer/skeleton representation of the children.
   * When false, the original component renders normally with zero DOM/layout alteration.
   */
  loading: boolean;

  /**
   * The React elements whose layout/structure will be used to generate the shimmer.
   */
  children: React.ReactNode;

  /**
   * Optional custom CSS class name applied to the loading shimmer container.
   */
  className?: string;

  /**
   * Optional inline styles for the loading shimmer container.
   */
  style?: React.CSSProperties;

  /**
   * When true, disables the shimmer effect completely (renders children directly).
   * @default false
   */
  disabled?: boolean;

  /**
   * Duration of the shimmer wave animation cycle in seconds.
   * @default 1.5
   */
  duration?: number;

  /**
   * Base background color for the skeleton element placeholders.
   * @default "#e2e8f0"
   */
  baseColor?: string;

  /**
   * Shimmer highlight/wave color passing over the skeleton placeholders.
   * @default "rgba(255, 255, 255, 0.65)"
   */
  highlightColor?: string;

  /**
   * Fallback border radius (in pixels) for elements without an explicit CSS border-radius.
   * Prevents harsh square blocks for text and badge nodes.
   * @default 6
   */
  borderRadius?: number;

  /**
   * Fallback UI to render if structural DOM measurement fails or throws an exception.
   */
  fallback?: React.ReactNode;

  /**
   * Delay in milliseconds before displaying the shimmer.
   * Useful for preventing shimmer flash on instantaneous / cached data loads.
   * @default 0
   */
  delay?: number;

  /**
   * Minimum duration in milliseconds that the shimmer remains visible once triggered.
   * Prevents jarring quick flickering when requests resolve in < 200ms.
   * @default 0
   */
  minimumDuration?: number;

  /**
   * Mock or template props injected into the first child component during loading.
   * Crucial for components whose DOM structure depends on dynamic API data (e.g. Tables, Lists, Cards).
   * Example: `templateProps={{ data: Array.from({ length: 5 }, (_, i) => ({ id: i, name: '...', email: '...' })) }}`
   */
  templateProps?: Record<string, unknown>;

  /**
   * Accessible description announced by screen readers during loading state.
   * @default "Loading content..."
   */
  ariaLabel?: string;

  /**
   * Optional data-testid attribute for automated testing.
   */
  testId?: string;
}

/**
 * Options for the useAutoShimmer hook.
 */
export interface UseAutoShimmerOptions {
  /**
   * Delay in ms before shimmer becomes active.
   */
  delay?: number;

  /**
   * Minimum duration in ms the shimmer remains active once shown.
   */
  minimumDuration?: number;

  /**
   * Default template props for dynamic data components.
   */
  templateProps?: Record<string, unknown>;
}

/**
 * Return signature of useAutoShimmer hook.
 */
export interface UseAutoShimmerReturn {
  /**
   * Synchronized loading boolean respecting delay and minimumDuration timing.
   */
  isLoading: boolean;

  /**
   * Standardized shimmer props ready to spread onto <AutoShimmer {...shimmerProps}>.
   */
  shimmerProps: {
    loading: boolean;
    templateProps?: Record<string, unknown>;
  };
}
