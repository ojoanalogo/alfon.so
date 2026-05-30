import type { BrowserHistories } from './useBrowserHistories';

interface BrowserContentProps {
  appId: string;
  browsers: BrowserHistories;
}

export default function BrowserContent({ appId, browsers }: BrowserContentProps) {
  const { url, reloadKey } = browsers.get(appId);

  if (!url) {
    return (
      <p className="text-xs text-muted">
        escribe una URL en la barra de arriba y presiona enter.
      </p>
    );
  }

  return (
    <iframe
      key={`${url}-${reloadKey}`}
      title={`web browser — ${url}`}
      src={url}
      className="browser-window__frame"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      referrerPolicy="no-referrer-when-downgrade"
      loading="lazy"
    />
  );
}
