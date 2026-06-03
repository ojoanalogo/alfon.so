import { useLayoutEffect, useState } from 'react';

/** SSR-safe default; replaced on mount with real viewport dimensions. */
const FALLBACK = { width: 390, height: 844 };

function readViewportSize() {
  if (typeof window === 'undefined') return FALLBACK;
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewportSize() {
  const [size, setSize] = useState(readViewportSize);

  useLayoutEffect(() => {
    let raf = 0;
    function apply() {
      raf = 0;
      const next = readViewportSize();
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
    }
    // Coalesce bursts of resize/visualViewport events into one update per frame.
    function schedule() {
      if (raf === 0) raf = requestAnimationFrame(apply);
    }
    apply();
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, []);

  return size;
}
