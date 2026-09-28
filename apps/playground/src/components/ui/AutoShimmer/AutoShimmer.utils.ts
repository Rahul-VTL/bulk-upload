import React from 'react';

/**
 * Checks whether the current environment has browser DOM APIs.
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Custom Error Boundary designed specifically to prevent any DOM measurement or
 * structure analysis failure in AutoShimmer from ever crashing the application.
 */
interface AutoShimmerErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface AutoShimmerErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AutoShimmerErrorBoundary extends React.Component<
  AutoShimmerErrorBoundaryProps,
  AutoShimmerErrorBoundaryState
> {
  constructor(props: AutoShimmerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AutoShimmerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const isDev = Boolean(
      (globalThis as Record<string, unknown>)?.process &&
      ((globalThis as Record<string, unknown>).process as Record<string, unknown>)?.env &&
      (((globalThis as Record<string, unknown>).process as Record<string, unknown>).env as Record<string, string>)?.NODE_ENV !== 'production'
    );
    if (isDev) {
      console.warn(
        '[AutoShimmer] Structural DOM analysis encountered an issue. Rendering safe fallback.',
        error,
        errorInfo
      );
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // If no fallback was provided, gracefully render original children
      return this.props.children;
    }

    return this.props.children;
  }
}

/**
 * Hook to manage loading transition with optional delay and minimumDuration.
 */
export const useDelayedLoading = (
  loading: boolean,
  delay: number = 0,
  minimumDuration: number = 0
): boolean => {
  const [active, setActive] = React.useState<boolean>(() => {
    // If delay > 0 and loading is initially true, start with false until delay timer fires
    return delay > 0 ? false : loading;
  });

  const startTimeRef = React.useRef<number | null>(null);
  const delayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    // Clear any pending timers
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (minTimerRef.current) clearTimeout(minTimerRef.current);

    if (loading) {
      if (delay > 0) {
        delayTimerRef.current = setTimeout(() => {
          startTimeRef.current = Date.now();
          setActive(true);
        }, delay);
      } else {
        startTimeRef.current = Date.now();
        setActive(true);
      }
    } else {
      // Loading turned false
      if (active && minimumDuration > 0 && startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = minimumDuration - elapsed;

        if (remaining > 0) {
          minTimerRef.current = setTimeout(() => {
            setActive(false);
            startTimeRef.current = null;
          }, remaining);
          return;
        }
      }
      setActive(false);
      startTimeRef.current = null;
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, [loading, delay, minimumDuration]);

  return active;
};
