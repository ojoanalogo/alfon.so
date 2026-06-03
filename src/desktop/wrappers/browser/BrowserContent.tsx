import { WINDOW_ACTION_BTN } from '@/styles/tokens';
import { isFrameBlockedUrl } from '../../browserUtils';
import type { BrowserHistories } from './useBrowserHistories';

interface BrowserContentProps {
  appId: string;
  browsers: BrowserHistories;
}

/** Friendly fallback for sites that refuse to load inside an iframe. */
function FrameBlockedNotice({ url }: { url: string }) {
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep the raw url if it somehow isn't parseable */
  }
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-3xl" aria-hidden="true">
        🔒
      </span>
      <p className="text-sm text-primary">
        <span className="font-medium">{host}</span> no permite incrustarse aquí.
      </p>
      <p className="max-w-xs text-xs text-muted">
        Muchos sitios (GitHub, X, YouTube…) bloquean su carga dentro de un iframe.
      </p>
      <a
        className={`${WINDOW_ACTION_BTN} no-underline`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        abrir en pestaña nueva ↗
      </a>
    </div>
  );
}

export default function BrowserContent({ appId, browsers }: BrowserContentProps) {
  const { url, reloadKey } = browsers.get(appId);

  if (!url) {
    return (
      <p className="text-xs text-muted">escribe una URL en la barra de arriba y presiona enter.</p>
    );
  }

  if (isFrameBlockedUrl(url)) {
    return <FrameBlockedNotice url={url} />;
  }

  return (
    <iframe
      key={`${url}-${reloadKey}`}
      title={`web browser — ${url}`}
      src={url}
      className="block h-full min-h-0 w-full flex-1 border-0 bg-white dark:bg-[#18181b]"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      referrerPolicy="no-referrer-when-downgrade"
      loading="lazy"
    />
  );
}
