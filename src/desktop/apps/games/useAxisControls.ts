import { useEffect } from 'react';

const AXIS_KEYS = ['ArrowLeft', 'ArrowRight', 'a', 'd'];

/**
 * Shared keyup teardown for the paddle/dodge games (pong, plane, breakout).
 * Takes the game's `moveRef` (the value its tick reads); the game's own keydown
 * sets it for arrow / A-D presses, and this hook clears it on keyup and whenever
 * the window goes inactive. The ref stays owned by the game so React can see it
 * as stable. Snake is excluded — it uses a direction model.
 */
export function useAxisControls(active: boolean, moveRef: { current: number }) {
  useEffect(() => {
    if (!active) {
      moveRef.current = 0;
      return;
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (AXIS_KEYS.includes(event.key)) moveRef.current = 0;
    }
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [active, moveRef]);
}
