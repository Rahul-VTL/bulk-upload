import React, { memo } from 'react';
import { Shimmer } from '@shimmer-from-structure/react';
import { AutoShimmerProps } from './AutoShimmer.types';
import { AUTO_SHIMMER_CONSTANTS } from './AutoShimmer.constants';
import { AutoShimmerErrorBoundary, useDelayedLoading, isBrowser } from './AutoShimmer.utils';

/**
 * `<AutoShimmer>`
 *
 * Global, reusable, automated skeleton & shimmer wrapper.
 * Inspects the child component's rendered DOM structure and overlays an animated,
 * pixel-perfect skeleton matching all headings, cards, badges, inputs, and buttons.
 *
 * @example
 * ```tsx
 * <AutoShimmer loading={isLoading}>
 *   <UserDashboard />
 * </AutoShimmer>
 * ```
 *
 * For components dependent on dynamic API collections (tables, lists, cards):
 * ```tsx
 * <AutoShimmer loading={isLoading} templateProps={{ users: mockUsers }}>
 *   <UserTable users={users} />
 * </AutoShimmer>
 * ```
 */
export const AutoShimmer: React.FC<AutoShimmerProps> = memo(({
  loading,
  children,
  className = '',
  style,
  disabled = false,
  duration = AUTO_SHIMMER_CONSTANTS.DEFAULT_DURATION,
  baseColor = AUTO_SHIMMER_CONSTANTS.DEFAULT_BASE_COLOR,
  highlightColor = AUTO_SHIMMER_CONSTANTS.DEFAULT_HIGHLIGHT_COLOR,
  borderRadius = AUTO_SHIMMER_CONSTANTS.DEFAULT_FALLBACK_BORDER_RADIUS,
  fallback,
  delay = AUTO_SHIMMER_CONSTANTS.DEFAULT_DELAY,
  minimumDuration = AUTO_SHIMMER_CONSTANTS.DEFAULT_MINIMUM_DURATION,
  templateProps,
  ariaLabel = AUTO_SHIMMER_CONSTANTS.DEFAULT_ARIA_LABEL,
  testId
}) => {
  // If disabled, bypass shimmer completely and preserve original UI
  if (disabled) {
    return <>{children}</>;
  }

  // Handle delay & minimum duration transitions
  const isShimmerActive = useDelayedLoading(loading, delay, minimumDuration);

  // When loading is false or shimmer is not active, render original component untouched
  // (Zero wrapper divs, zero layout shifts, zero margin/padding modifications)
  if (!isShimmerActive) {
    return <>{children}</>;
  }

  // Guard against SSR / non-browser execution
  if (!isBrowser()) {
    return fallback ? <>{fallback}</> : <>{children}</>;
  }

  const containerClassName = `${AUTO_SHIMMER_CONSTANTS.CLASS_NAMES.ROOT} ${AUTO_SHIMMER_CONSTANTS.CLASS_NAMES.ACTIVE} ${className}`.trim();

  return (
    <AutoShimmerErrorBoundary fallback={fallback}>
      <div
        className={containerClassName}
        style={style}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel}
        data-testid={testId || 'auto-shimmer-container'}
      >
        <Shimmer
          loading={true}
          backgroundColor={baseColor}
          shimmerColor={highlightColor}
          duration={duration}
          fallbackBorderRadius={borderRadius}
          templateProps={templateProps}
        >
          {children}
        </Shimmer>
      </div>
    </AutoShimmerErrorBoundary>
  );
});

AutoShimmer.displayName = 'AutoShimmer';
