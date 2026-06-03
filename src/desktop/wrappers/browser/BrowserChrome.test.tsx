import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { makeAppContext } from '@test/factories';
import BrowserChrome from './BrowserChrome';
import type { BrowserHistories, BrowserAppState } from './useBrowserHistories';

const EMPTY: BrowserAppState = { url: null, history: [], index: -1, reloadKey: 0 };

/**
 * A configurable BrowserHistories mock. Starts from the factory's vi.fn() shape
 * so every method is a spy, then overrides `get`/`canBack`/`canForward` with the
 * provided values and lets `navigate` return whatever the test wants.
 */
function makeBrowsers(
  opts: {
    state?: Partial<BrowserAppState>;
    canBack?: boolean;
    canForward?: boolean;
    navigateReturn?: string | null;
  } = {},
): BrowserHistories {
  const state: BrowserAppState = { ...EMPTY, ...opts.state };
  const base = makeAppContext().browsers;
  return {
    ...base,
    get: vi.fn(() => state),
    canBack: vi.fn(() => opts.canBack ?? false),
    canForward: vi.fn(() => opts.canForward ?? false),
    navigate: vi.fn(() => opts.navigateReturn ?? null),
  };
}

const APP_ID = 'site';

function renderChrome(
  browsers: BrowserHistories,
  props: Partial<{ title: string; hideTitle: boolean }> = {},
) {
  return render(
    <BrowserChrome
      appId={APP_ID}
      title={props.title ?? 'mi sitio'}
      browsers={browsers}
      hideTitle={props.hideTitle}
    />,
  );
}

const addressInput = () => screen.getByLabelText('Dirección web') as HTMLInputElement;
const backBtn = () => screen.getByLabelText('Página anterior') as HTMLButtonElement;
const forwardBtn = () => screen.getByLabelText('Página siguiente') as HTMLButtonElement;
const reloadBtn = () => screen.getByLabelText('Recargar página') as HTMLButtonElement;

describe('BrowserChrome', () => {
  it('shows the app title by default and hides it when hideTitle is set', () => {
    const { container, rerender } = renderChrome(makeBrowsers(), { title: 'my site' });
    expect(screen.getByText('my site')).toBeTruthy();

    rerender(<BrowserChrome appId={APP_ID} title="my site" browsers={makeBrowsers()} hideTitle />);
    expect(screen.queryByText('my site')).toBeNull();
    // nav group + address bar still render
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('seeds the address input from the current url', () => {
    renderChrome(makeBrowsers({ state: { url: 'https://example.com' } }));
    expect(addressInput().value).toBe('https://example.com');
  });

  it('renders an empty address input when url is null', () => {
    renderChrome(makeBrowsers());
    expect(addressInput().value).toBe('');
    expect(addressInput().getAttribute('placeholder')).toBe('about:blank');
  });

  it('typing updates the draft input without navigating', () => {
    const browsers = makeBrowsers();
    renderChrome(browsers);

    fireEvent.change(addressInput(), { target: { value: 'example.org' } });
    expect(addressInput().value).toBe('example.org');
    expect(browsers.navigate).not.toHaveBeenCalled();
  });

  it('Enter navigates with the typed draft for the given appId', () => {
    const browsers = makeBrowsers({ navigateReturn: 'https://example.org' });
    renderChrome(browsers);

    fireEvent.change(addressInput(), { target: { value: 'example.org' } });
    fireEvent.keyDown(addressInput(), { key: 'Enter' });

    expect(browsers.navigate).toHaveBeenCalledWith(APP_ID, 'example.org');
  });

  it('a non-Enter keypress does not navigate', () => {
    const browsers = makeBrowsers();
    renderChrome(browsers);

    fireEvent.change(addressInput(), { target: { value: 'x' } });
    fireEvent.keyDown(addressInput(), { key: 'a' });
    expect(browsers.navigate).not.toHaveBeenCalled();
  });

  it('restores the draft to the canonical url when navigate is rejected', () => {
    // navigate returns null (invalid url) and there is an existing url -> revert
    const browsers = makeBrowsers({
      state: { url: 'https://current.dev' },
      navigateReturn: null,
    });
    renderChrome(browsers);

    fireEvent.change(addressInput(), { target: { value: 'garbage input' } });
    expect(addressInput().value).toBe('garbage input');

    fireEvent.keyDown(addressInput(), { key: 'Enter' });
    expect(browsers.navigate).toHaveBeenCalledWith(APP_ID, 'garbage input');
    // draft reverted back to the canonical url
    expect(addressInput().value).toBe('https://current.dev');
  });

  it('does not revert the draft when there is no canonical url and navigate fails', () => {
    const browsers = makeBrowsers({ navigateReturn: null });
    renderChrome(browsers);

    fireEvent.change(addressInput(), { target: { value: 'still typing' } });
    fireEvent.keyDown(addressInput(), { key: 'Enter' });
    expect(addressInput().value).toBe('still typing');
  });

  it('disables back/forward per canBack/canForward and reload per url presence', () => {
    renderChrome(makeBrowsers({ state: { url: null }, canBack: false, canForward: false }));
    expect(backBtn().disabled).toBe(true);
    expect(forwardBtn().disabled).toBe(true);
    // reload disabled when no url
    expect(reloadBtn().disabled).toBe(true);
  });

  it('enables back/forward when the history allows it', () => {
    renderChrome(
      makeBrowsers({
        state: { url: 'https://example.com' },
        canBack: true,
        canForward: true,
      }),
    );
    expect(backBtn().disabled).toBe(false);
    expect(forwardBtn().disabled).toBe(false);
    expect(reloadBtn().disabled).toBe(false);
  });

  it('wires back/forward/reload buttons to the controller for the appId', () => {
    const browsers = makeBrowsers({
      state: { url: 'https://example.com' },
      canBack: true,
      canForward: true,
    });
    renderChrome(browsers);

    fireEvent.click(backBtn());
    expect(browsers.back).toHaveBeenCalledWith(APP_ID);

    fireEvent.click(forwardBtn());
    expect(browsers.forward).toHaveBeenCalledWith(APP_ID);

    fireEvent.click(reloadBtn());
    expect(browsers.reload).toHaveBeenCalledWith(APP_ID);
  });

  it('does not invoke back/forward when disabled', () => {
    const browsers = makeBrowsers({ state: { url: null } });
    renderChrome(browsers);

    fireEvent.click(backBtn());
    fireEvent.click(forwardBtn());
    expect(browsers.back).not.toHaveBeenCalled();
    expect(browsers.forward).not.toHaveBeenCalled();
  });

  it('renders the open-in-new-tab link only when a url is present', () => {
    const { container, rerender } = renderChrome(makeBrowsers());
    expect(container.querySelector('a[target="_blank"]')).toBeNull();

    rerender(
      <BrowserChrome
        appId={APP_ID}
        title="mi sitio"
        browsers={makeBrowsers({ state: { url: 'https://example.com' } })}
      />,
    );
    const link = container.querySelector('a[target="_blank"]') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('syncs the input to external navigation (back/forward changing the url)', () => {
    const browsers = makeBrowsers({ state: { url: 'https://one.dev' } });
    const { rerender } = renderChrome(browsers);
    expect(addressInput().value).toBe('https://one.dev');

    // Simulate the controller URL changing out from under the input.
    const browsers2 = makeBrowsers({ state: { url: 'https://two.dev' } });
    rerender(<BrowserChrome appId={APP_ID} title="mi sitio" browsers={browsers2} />);
    expect(addressInput().value).toBe('https://two.dev');
  });

  it('reads state/canBack/canForward for the provided appId', () => {
    const browsers = makeBrowsers({ state: { url: 'https://example.com' } });
    render(<BrowserChrome appId="custom-app" title="t" browsers={browsers} />);
    expect(browsers.get).toHaveBeenCalledWith('custom-app');
    expect(browsers.canBack).toHaveBeenCalledWith('custom-app');
    expect(browsers.canForward).toHaveBeenCalledWith('custom-app');
  });
});
