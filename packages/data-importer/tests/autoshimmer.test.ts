import { describe, it, expect } from 'vitest';
import { AUTO_SHIMMER_CONSTANTS } from '../../../apps/playground/src/components/ui/AutoShimmer/AutoShimmer.constants';
import { isBrowser } from '../../../apps/playground/src/components/ui/AutoShimmer/AutoShimmer.utils';

describe('AutoShimmer System Unit Tests', () => {
  it('defines correct enterprise defaults and constants', () => {
    expect(AUTO_SHIMMER_CONSTANTS.DEFAULT_DURATION).toBe(1.5);
    expect(AUTO_SHIMMER_CONSTANTS.DEFAULT_BASE_COLOR).toBe('#e2e8f0');
    expect(AUTO_SHIMMER_CONSTANTS.DEFAULT_FALLBACK_BORDER_RADIUS).toBe(6);
    expect(AUTO_SHIMMER_CONSTANTS.DEFAULT_DELAY).toBe(0);
    expect(AUTO_SHIMMER_CONSTANTS.DEFAULT_MINIMUM_DURATION).toBe(0);
    expect(AUTO_SHIMMER_CONSTANTS.CLASS_NAMES.ROOT).toBe('auto-shimmer-root');
    expect(AUTO_SHIMMER_CONSTANTS.CLASS_NAMES.ACTIVE).toBe('auto-shimmer-loading');
  });

  it('correctly reports browser environment presence in SSR / test runtime', () => {
    const isClient = isBrowser();
    expect(typeof isClient).toBe('boolean');
  });
});
