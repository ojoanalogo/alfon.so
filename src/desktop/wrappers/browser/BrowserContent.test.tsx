import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeAppContext } from '@test/factories';
import BrowserContent from './BrowserContent';
import type { BrowserHistories, BrowserAppState } from './useBrowserHistories';

const EMPTY: BrowserAppState = { url: null, history: [], index: -1, reloadKey: 0 };

function makeBrowsers(state: Partial<BrowserAppState> = {}): BrowserHistories {
  const merged: BrowserAppState = { ...EMPTY, ...state };
  return {
    ...makeAppContext().browsers,
    get: vi.fn(() => merged),
  };
}

const APP_ID = 'site';

describe('BrowserContent', () => {
  it('renders the empty-state prompt when there is no url', () => {
    const { container } = render(
      <BrowserContent appId={APP_ID} browsers={makeBrowsers()} />,
    );
    expect(
      screen.getByText('escribe una URL en la barra de arriba y presiona enter.'),
    ).toBeTruthy();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders an iframe pointing at the current url', () => {
    const { container } = render(
      <BrowserContent
        appId={APP_ID}
        browsers={makeBrowsers({ url: 'https://example.com' })}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toBe('https://example.com');
  });

  it('titles the iframe with the current url', () => {
    const { container } = render(
      <BrowserContent
        appId={APP_ID}
        browsers={makeBrowsers({ url: 'https://example.com' })}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('title')).toBe('web browser — https://example.com');
  });

  it('applies the sandbox and referrer-policy hardening attributes', () => {
    const { container } = render(
      <BrowserContent
        appId={APP_ID}
        browsers={makeBrowsers({ url: 'https://example.com' })}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('sandbox')).toBe(
      'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms',
    );
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer-when-downgrade');
    expect(iframe.getAttribute('loading')).toBe('lazy');
  });

  it('reads state for the provided appId', () => {
    const browsers = makeBrowsers({ url: 'https://example.com' });
    render(<BrowserContent appId="other-app" browsers={browsers} />);
    expect(browsers.get).toHaveBeenCalledWith('other-app');
  });

  it('keys the iframe so url + reloadKey changes force a remount', () => {
    const { container, rerender } = render(
      <BrowserContent
        appId={APP_ID}
        browsers={makeBrowsers({ url: 'https://example.com', reloadKey: 0 })}
      />,
    );
    const first = container.querySelector('iframe');
    expect(first).toBeTruthy();

    // A new url should still render an iframe at the new src.
    rerender(
      <BrowserContent
        appId={APP_ID}
        browsers={makeBrowsers({ url: 'https://other.com', reloadKey: 1 })}
      />,
    );
    const second = container.querySelector('iframe') as HTMLIFrameElement;
    expect(second.getAttribute('src')).toBe('https://other.com');
  });
});
