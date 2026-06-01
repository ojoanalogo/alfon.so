import { useEffect, useState } from 'react';

/** SSR-safe default; replaced on mount with real viewport dimensions. */
const FALLBACK = { width: 390, height: 844 };

function readViewportSize() {
  if (typeof window === 'undefined') return FALLBACK;
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewportSize() {
  const [size, setSize] = useState(readViewportSize);

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
