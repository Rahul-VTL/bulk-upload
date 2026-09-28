import { useMemo } from 'react';
import { UseAutoShimmerOptions, UseAutoShimmerReturn } from '../components/ui/AutoShimmer/AutoShimmer.types';
import { useDelayedLoading } from '../components/ui/AutoShimmer/AutoShimmer.utils';

/**
 * Custom hook to streamline using <AutoShimmer> with delay, minimumDuration,
 * and templateProps injection.
 *
 * @example
 * ```tsx
 * const { isLoading, shimmerProps } = useAutoShimmer(loading, {
 *   delay: 150,
 *   minimumDuration: 400,
 *   templateProps: { users: placeholderUsers }
 * });
 *
 * return (
 *   <AutoShimmer {...shimmerProps}>
 *     <UserTable users={users} />
 *   </AutoShimmer>
 * );
 * ```
 */
export function useAutoShimmer(
  loading: boolean,
  options: UseAutoShimmerOptions = {}
): UseAutoShimmerReturn {
  const { delay = 0, minimumDuration = 0, templateProps } = options;

  const isDelayedLoading = useDelayedLoading(loading, delay, minimumDuration);

  const shimmerProps = useMemo(() => {
    return {
      loading: isDelayedLoading,
      templateProps
    };
  }, [isDelayedLoading, templateProps]);

  return {
    isLoading: isDelayedLoading,
    shimmerProps
  };
}
