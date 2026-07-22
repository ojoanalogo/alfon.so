import { useEffect } from 'react';

// Compared case-insensitively: a keyup with Shift/CapsLock held reports 'A',
// and failing to match it would leave the paddle/plane drifting.
const AXIS_KEYS = ['arrowleft', 'arrowright', 'a', 'd'];

/**
 * Shared keyup teardown for the paddle/dodge games (pong, plane, breakout).
 * Takes the game's `moveRef` (the value its tick reads); the game's own keydown
 * sets it for arrow / A-D presses, and this hook clears it on keyup, whenever
 * the window goes inactive, and on OS-window blur (a key released while the
 * browser is unfocused never delivers its keyup). The ref stays owned by the
 * game so React can see it as stable. Snake is excluded — it uses a direction
 * model.
 */
export function useAxisControls(active: boolean, moveRef: { current: number }) {
  useEffect(() => {
    if (!active) {
      moveRef.current = 0;
      return;
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (AXIS_KEYS.includes(event.key.toLowerCase())) moveRef.current = 0;
    }
    function handleBlur() {
      moveRef.current = 0;
    }
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [active, moveRef]);
}
