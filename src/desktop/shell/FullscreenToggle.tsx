import { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function FullscreenToggle({ className }: { className?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement != null);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggle = useCallback(() => {
    // Fullscreen requests can be denied (browser policy) → swallow rejections.
    if (document.fullscreenElement) {
      void document.exitFullscreen()?.catch(() => {});
      return;
    }
    void document.documentElement.requestFullscreen()?.catch(() => {});
  }, []);

  const label = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-tooltip={label}
      onClick={toggle}
      className={[
        'tooltip grid cursor-pointer place-items-center p-1 text-secondary transition-colors duration-200 hover:text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      ) : (
        <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
