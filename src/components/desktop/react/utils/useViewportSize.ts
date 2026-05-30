import { useEffect, useState } from 'react';

/** SSR-safe default; replaced on mount with real viewport dimensions. */
const FALLBACK = { width: 390, height: 844 };

export function useViewportSize() {
  const [size, setSize] = useState(FALLBACK);

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
