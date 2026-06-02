import { useEffect, useRef, useState } from 'react';
import { SITE_TITLE } from '@/config';
import { useWallpaper } from '../state/WallpaperContext';

const BOOT_MIN_MS = 400;
const BOOT_EXIT_MS = 120;

type BootPhase = 'loading' | 'exiting' | 'done';

/** Survives provider remounts so resize does not replay the boot screen. */
let bootFinished = false;

export default function DesktopBootOverlay() {
  const { bootContentReady } = useWallpaper();
  const [phase, setPhase] = useState<BootPhase>(() => (bootFinished ? 'done' : 'loading'));
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (startedAtRef.current === 0) {
      startedAtRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!bootContentReady || phase !== 'loading') return;

    const remaining = Math.max(0, BOOT_MIN_MS - (Date.now() - startedAtRef.current));
    const timer = window.setTimeout(() => setPhase('exiting'), remaining);
    return () => window.clearTimeout(timer);
  }, [bootContentReady, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;

    const timer = window.setTimeout(() => setPhase('done'), BOOT_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') bootFinished = true;
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={['desktop-boot-overlay', phase === 'exiting' && 'desktop-boot-overlay--exiting']
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
      aria-busy={phase === 'loading'}
      aria-label={phase === 'loading' ? `Loading ${SITE_TITLE}` : undefined}
    >
      <div className="desktop-boot-overlay__content">
        <span className="desktop-boot-overlay__spinner" aria-hidden="true" />
        <p className="desktop-boot-overlay__loading">Loading</p>
        <p className="desktop-boot-overlay__site">{SITE_TITLE}</p>
      </div>
    </div>
  );
}
