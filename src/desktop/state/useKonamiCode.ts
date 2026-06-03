import { useEffect, useRef } from 'react';
import { createKonamiMatcher } from '../lib/konami';

/**
 * Fires `onUnlock` when the Konami code is entered. The listener lives only
 * while the hook is mounted, so the easter egg is active only on the desktop.
 */
export function useKonamiCode(onUnlock: () => void): void {
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    const matcher = createKonamiMatcher();
    function handleKeyDown(event: KeyboardEvent) {
      if (matcher.push(event.key)) {
        onUnlockRef.current();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
