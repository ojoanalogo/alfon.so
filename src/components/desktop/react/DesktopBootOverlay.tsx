import { useEffect, useRef, useState } from 'react';
import { SITE_TITLE } from '../../../config';
import { useWallpaper } from './context/WallpaperContext';

const BOOT_MIN_MS = 400;
const BOOT_EXIT_MS = 120;

type BootPhase = 'loading' | 'exiting' | 'done';

export default function DesktopBootOverlay() {
  const { bootContentReady } = useWallpaper();
  const [phase, setPhase] = useState<BootPhase>('loading');
  const startedAtRef = useRef(Date.now());

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

  if (phase === 'done') return null;

  return (
    <div
      className={[
        'desktop-boot-overlay',
        phase === 'exiting' && 'desktop-boot-overlay--exiting',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
      aria-busy={phase === 'loading'}
      aria-label={phase === 'loading' ? `Loading ${SITE_TITLE}` : undefined}
    >
      <div className="desktop-boot-overlay__content">
        <span className="desktop-boot-overlay__spinner" aria-hidden="true" />
        <p className="desktop-boot-overlay__loading">loading</p>
        <p className="desktop-boot-overlay__site">{SITE_TITLE}</p>
      </div>
    </div>
  );
}
