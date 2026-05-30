import { useState } from 'react';
import type { BrowserHistories } from './useBrowserHistories';

interface BrowserChromeProps {
  appId: string;
  title: string;
  browsers: BrowserHistories;
  /** Hide the app label so only nav + address bar render (e.g. site-launcher apps). */
  hideTitle?: boolean;
}

/** Address bar + back/forward/reload, mounted into the window's titlebar. */
export default function BrowserChrome({ appId, title, browsers, hideTitle = false }: BrowserChromeProps) {
  const state = browsers.get(appId);
  const url = state.url;
  const canBack = browsers.canBack(appId);
  const canForward = browsers.canForward(appId);

  // Sync draft to the canonical URL. Tracked via a tracker state so external
  // navigation (back/forward, programmatic .navigate()) reflects in the input
  // without queueing an effect.
  const [draft, setDraft] = useState(url ?? '');
  const [seenUrl, setSeenUrl] = useState(url);
  if (seenUrl !== url) {
    setSeenUrl(url);
    setDraft(url ?? '');
  }

  function submitAddress() {
    const next = browsers.navigate(appId, draft);
    if (!next && url) setDraft(url);
  }

  return (
    <div className="browser-titlebar">
      {!hideTitle && <span className="browser-titlebar__app">{title}</span>}
      <div
        onPointerDown={(event) => event.stopPropagation()}
        role="group"
        aria-label="Navegación"
        style={{ display: 'inline-flex', gap: '0.25rem' }}
      >
        <button
          type="button"
          className="browser-titlebar__reload"
          title="Atrás"
          aria-label="Página anterior"
          disabled={!canBack}
          onClick={() => browsers.back(appId)}
        >
          ←
        </button>
        <button
          type="button"
          className="browser-titlebar__reload"
          title="Adelante"
          aria-label="Página siguiente"
          disabled={!canForward}
          onClick={() => browsers.forward(appId)}
        >
          →
        </button>
        <button
          type="button"
          className="browser-titlebar__reload"
          title="Recargar"
          aria-label="Recargar página"
          disabled={!url}
          onClick={() => browsers.reload(appId)}
        >
          ↻
        </button>
      </div>
      <div
        className="browser-titlebar__address"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="browser-titlebar__scheme" aria-hidden="true">
          🌐
        </span>
        <input
          type="text"
          className="browser-titlebar__url-input"
          value={draft}
          placeholder="about:blank"
          aria-label="Dirección web"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitAddress();
            }
          }}
        />
        {url && (
          <a
            className="browser-titlebar__external"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en pestaña nueva"
            onClick={(event) => event.stopPropagation()}
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}
