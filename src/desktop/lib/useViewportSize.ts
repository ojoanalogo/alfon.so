import { useEffect, useLayoutEffect, useState } from 'react';

/** SSR-safe default; replaced on mount with real viewport dimensions. */
const FALLBACK = { width: 390, height: 844 };

function readViewportSize() {
  if (typeof window === 'undefined') return FALLBACK;
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewportSize() {
  const [size, setSize] = useState(readViewportSize);

  useLayoutEffect(() => {
    function update() {
      const next = readViewportSize();
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    }
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return size;
}
