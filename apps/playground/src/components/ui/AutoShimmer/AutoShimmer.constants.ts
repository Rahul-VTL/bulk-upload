/**
 * Default design tokens and timing thresholds for the AutoShimmer system.
 */
export const AUTO_SHIMMER_CONSTANTS = {
  /**
   * Default duration in seconds for one full pass of the shimmer wave.
   */
  DEFAULT_DURATION: 1.5,

  /**
   * Default neutral skeleton block background color.
   */
  DEFAULT_BASE_COLOR: '#e2e8f0',

  /**
   * Default highlight gradient shimmer color.
   */
  DEFAULT_HIGHLIGHT_COLOR: 'rgba(255, 255, 255, 0.65)',

  /**
   * Default fallback border radius (px) for elements lacking rounded corners.
   */
  DEFAULT_FALLBACK_BORDER_RADIUS: 6,

  /**
   * Default delay in milliseconds before shimmer is shown.
   */
  DEFAULT_DELAY: 0,

  /**
   * Default minimum time in milliseconds shimmer stays visible once shown.
   */
  DEFAULT_MINIMUM_DURATION: 0,

  /**
   * Default screen-reader accessibility announcement.
   */
  DEFAULT_ARIA_LABEL: 'Loading content, please wait...',

  /**
   * CSS class names used for AutoShimmer container and states.
   */
  CLASS_NAMES: {
    ROOT: 'auto-shimmer-root',
    ACTIVE: 'auto-shimmer-loading',
    CONTAINER: 'auto-shimmer-container',
    FALLBACK: 'auto-shimmer-fallback'
  }
} as const;
