import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';
import { browserApp } from './browserApp';
import { resolveAppTitle, type AppContext } from '../types';

/** Build an AppContext whose browsers.get returns `url` for the given app id. */
function ctxWithUrl(url: string | null, overrides: Partial<AppContext> = {}): AppContext {
  return makeAppContext({
    browsers: {
      ...makeAppContext().browsers,
      get: () => ({ url }) as never,
    },
    ...overrides,
  });
}

describe('browserApp', () => {
  it('carries default browser metadata (className, geometry merge, hidden desktop icon)', () => {
    const app = browserApp({ id: 'site' });

    expect(app.id).toBe('site');
    expect(app.windowClassName).toBe('desktop-window--browser');
    expect(app.bodyClassName).toBe('browser-window__body');
    expect(app.iconKey).toBe('startup');
    expect(app.desktopIcon).toBe(false);
    expect(app.geometry.defaultWidth).toBe(800);
    expect(app.geometry.minWidth).toBe(480);
  });

  it('merges a partial geometry override over the browser defaults', () => {
    const app = browserApp({ id: 'site', geometry: { defaultWidth: 1000 } });

    expect(app.geometry.defaultWidth).toBe(1000);
    // untouched defaults remain
    expect(app.geometry.minWidth).toBe(480);
    expect(app.geometry.initialZ).toBe(30);
  });

  it('seeds initialBrowserUrl from initialUrl (null when absent)', () => {
    expect(browserApp({ id: 'a', initialUrl: 'https://x.test' }).initialBrowserUrl).toBe(
      'https://x.test',
    );
    expect(browserApp({ id: 'b' }).initialBrowserUrl).toBe(null);
  });

  it('uses the fallback title when no current url and no initialUrl', () => {
    const app = browserApp({ id: 'site' });
    // default fallback is "navegador" -> formatWindowTitle uppercases -> "Navegador"
    expect(resolveAppTitle(app, ctxWithUrl(null))).toBe('Navegador');
  });

  it('uses a custom title as the fallback', () => {
    const app = browserApp({ id: 'site', title: 'mi sitio' });
    expect(resolveAppTitle(app, ctxWithUrl(null))).toBe('Mi sitio');
  });

  it('derives the host from the current browser url', () => {
    const app = browserApp({ id: 'site' });
    expect(resolveAppTitle(app, ctxWithUrl('https://example.com/path?q=1'))).toBe('Example.com');
  });

  it('falls back to initialUrl host when current url is null', () => {
    const app = browserApp({ id: 'site', initialUrl: 'https://fallback.dev/page' });
    expect(resolveAppTitle(app, ctxWithUrl(null))).toBe('Fallback.dev');
  });

  it('prefers the current url over initialUrl when both are present', () => {
    const app = browserApp({ id: 'site', initialUrl: 'https://initial.dev' });
    expect(resolveAppTitle(app, ctxWithUrl('https://current.dev'))).toBe('Current.dev');
  });

  it('falls back when the current url is not parseable', () => {
    const app = browserApp({ id: 'site', title: 'mi sitio' });
    expect(resolveAppTitle(app, ctxWithUrl('not a url'))).toBe('Mi sitio');
  });

  it('renders the iframe body when a url is present', () => {
    const app = browserApp({ id: 'site' });
    const { container } = render(
      app.render(
        ctxWithUrl('https://example.com'),
        makeWindowChromeProps({ state: makeWindowState({ open: true }) }),
      ),
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toBe('https://example.com');
  });

  it('renders the empty-state prompt when no url', () => {
    const app = browserApp({ id: 'site' });
    render(
      app.render(
        ctxWithUrl(null),
        makeWindowChromeProps({ state: makeWindowState({ open: true }) }),
      ),
    );

    expect(
      screen.getByText('escribe una URL en la barra de arriba y presiona enter.'),
    ).toBeTruthy();
  });

  it('renders the derived host in the titlebar chrome', () => {
    const app = browserApp({ id: 'site' });
    const { container } = render(
      app.render(
        ctxWithUrl('https://news.ycombinator.com/'),
        makeWindowChromeProps({ state: makeWindowState({ open: true }) }),
      ),
    );

    expect(container.textContent).toContain('News.ycombinator.com');
  });

  it('uses the taskbarTooltip fallback equal to the title', () => {
    expect(browserApp({ id: 'site' }).taskbarTooltip).toBe('navegador');
    expect(browserApp({ id: 'site', title: 'foo' }).taskbarTooltip).toBe('foo');
    expect(browserApp({ id: 'site', taskbarTooltip: 'tip' }).taskbarTooltip).toBe('tip');
  });

  it('forwards custom iconKey, iconUrl, availableWhen, and desktopIcon', () => {
    const availableWhen = () => true;
    const desktopIcon = { label: 'Site' };
    const app = browserApp({
      id: 'site',
      iconKey: 'notes',
      iconUrl: '/x.png',
      availableWhen,
      desktopIcon,
    });
    expect(app.iconKey).toBe('notes');
    expect(app.iconUrl).toBe('/x.png');
    expect(app.availableWhen).toBe(availableWhen);
    expect(app.desktopIcon).toBe(desktopIcon);
  });

  it('hides the title label in the chrome when hideTitle is set', () => {
    const app = browserApp({ id: 'site', hideTitle: true });
    const { container } = render(
      app.render(
        ctxWithUrl('https://news.ycombinator.com/'),
        makeWindowChromeProps({ state: makeWindowState({ open: true }) }),
      ),
    );
    // The derived host is the title label; hideTitle drops it from the chrome.
    expect(container.textContent).not.toContain('News.ycombinator.com');
  });
});
