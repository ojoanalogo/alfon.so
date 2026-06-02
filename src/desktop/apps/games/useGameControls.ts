import { useEffect } from 'react';

/** Window-level key handler; only attached while the game window is active. */
export function useGameControls(
  active: boolean,
  onKeyDown: (event: KeyboardEvent) => boolean | void,
) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (onKeyDown(event)) event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onKeyDown]);
}
