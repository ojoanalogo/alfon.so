import { useState } from 'react';
import type { BrowserHistories } from './useBrowserHistories';

interface BrowserChromeProps {
  appId: string;
  title: string;
  browsers: BrowserHistories;
  /** Hide the app label so only nav + address bar render (e.g. site-launcher apps). */
  hideTitle?: boolean;
}

const RELOAD_BTN =
  'inline-flex h-[1.125rem] shrink-0 cursor-pointer items-center justify-center border border-[color:var(--color-hairline)] bg-[var(--color-control-fill)] px-[0.3125rem] py-0 text-[0.6875rem] leading-none text-secondary enabled:hover:border-[color:var(--color-highlight-border)] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 dark:bg-[rgb(24_24_27/0.65)] max-sm:h-6 max-sm:min-w-6 max-sm:px-[0.375rem]';

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
    <div className="flex w-full min-w-0 flex-1 items-center gap-[0.375rem] leading-none">
      {!hideTitle && (
        <span className="shrink-0 text-[0.6875rem] leading-[1.2] text-muted lowercase max-sm:hidden">
          {title}
        </span>
      )}
      <div
        onPointerDown={(event) => event.stopPropagation()}
        role="group"
        aria-label="Navegación"
        style={{ display: 'inline-flex', gap: '0.25rem' }}
      >
        <button
          type="button"
          className={RELOAD_BTN}
          title="Atrás"
          aria-label="Página anterior"
          disabled={!canBack}
          onClick={() => browsers.back(appId)}
        >
          ←
        </button>
        <button
          type="button"
          className={RELOAD_BTN}
          title="Adelante"
          aria-label="Página siguiente"
          disabled={!canForward}
          onClick={() => browsers.forward(appId)}
        >
          →
        </button>
        <button
          type="button"
          className={RELOAD_BTN}
          title="Recargar"
          aria-label="Recargar página"
          disabled={!url}
          onClick={() => browsers.reload(appId)}
        >
          ↻
        </button>
      </div>
      <div
        className="flex h-[1.125rem] min-w-0 flex-1 items-center gap-1 border border-[color:var(--color-hairline)] bg-[var(--color-control-fill)] px-[0.3125rem] py-0 font-[ui-monospace,monospace] text-[0.6875rem] leading-none dark:bg-[rgb(24_24_27/0.65)] max-sm:h-6"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="shrink-0 text-[0.625rem] leading-none" aria-hidden="true">
          🌐
        </span>
        <input
          type="text"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-[ui-monospace,monospace] text-[0.6875rem] leading-[1.2] text-secondary outline-none placeholder:text-muted focus:text-primary"
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
            className="shrink-0 px-[0.125rem] py-0 text-[0.6875rem] leading-none text-secondary no-underline hover:text-accent hover:underline"
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
