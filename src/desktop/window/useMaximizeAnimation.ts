import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Cross-fade state for maximize/restore. `displayMaximized` lags `maximized` by
 * one rAF so the transition class can apply, and `maximizeTransition` is true
 * only during the ~360ms animation window. When animation isn't possible
 * (closed / minimized / reduced-motion) the display value snaps synchronously.
 */
export function useMaximizeAnimation(maximized: boolean, canAnimate: boolean) {
  const prevMaximizedRef = useRef(maximized);
  const [maximizeTransition, setMaximizeTransition] = useState(false);
  const [displayMaximized, setDisplayMaximized] = useState(maximized);

  // Derive-state-from-props with an equality bail-out (valid render-phase setState).
  if (!canAnimate && displayMaximized !== maximized) {
    setDisplayMaximized(maximized);
  }

  useLayoutEffect(() => {
    if (!canAnimate) {
      prevMaximizedRef.current = maximized;
      return;
    }
    if (maximized === prevMaximizedRef.current) return;
    prevMaximizedRef.current = maximized;

    const frame = requestAnimationFrame(() => {
      setDisplayMaximized(maximized);
      setMaximizeTransition(true);
    });
    const timer = window.setTimeout(() => setMaximizeTransition(false), 360);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [maximized, canAnimate]);

  return { displayMaximized, maximizeTransition };
}
