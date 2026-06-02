import { useEffect } from 'react';

/** Fixed-interval tick; only runs while the game window is active. */
export function useGameLoop(active: boolean, tick: () => void, intervalMs: number) {
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [active, tick, intervalMs]);
}
