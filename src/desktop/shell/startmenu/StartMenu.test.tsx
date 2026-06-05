import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import StartMenu, { type StartMenuProps } from './StartMenu';
import { NAV_LINKS, SOCIAL_LINKS, SITE_TITLE, type DesktopIcon } from '@/config';

function makeIcon(overrides: Partial<DesktopIcon> = {}): DesktopIcon {
  return {
    id: 'notepad',
    label: 'Notepad',
    windowId: 'notepad-window',
    iconSrc: '/icons/notepad.png',
    ...overrides,
  };
}

function setup(overrides: Partial<StartMenuProps> = {}) {
  const anchor = document.createElement('button');
  anchor.textContent = 'start';
  document.body.appendChild(anchor);
  const anchorRef = createRef<HTMLElement | null>();
  // assign current to the live DOM node
  (anchorRef as { current: HTMLElement | null }).current = anchor;

  const props: StartMenuProps = {
    anchorRef,
    apps: overrides.apps ?? [makeIcon()],
    onClose: vi.fn(),
    onOpenExternal: vi.fn(),
    onOpenWindow: vi.fn(),
    onCloseAllWindows: vi.fn(),
    ...overrides,
  };

  const result = render(<StartMenu {...props} />);
  return { ...result, props, anchor };
}

describe('StartMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the menu container with header title and app list', () => {
    setup({ apps: [makeIcon({ label: 'My App' })] });

    const menu = document.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(screen.getByText(SITE_TITLE)).toBeTruthy();
    expect(screen.getByText('My App')).toBeTruthy();
  });

  it('renders one menuitem button per app with its icon src', () => {
    const { container } = setup({
      apps: [
        makeIcon({ id: 'a', label: 'Alpha', windowId: 'alpha-win', iconSrc: '/a.png' }),
        makeIcon({ id: 'b', label: 'Beta', windowId: 'beta-win', iconSrc: '/b.png' }),
      ],
    });

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();

    const imgs = container.querySelectorAll('section[aria-label="Programas"] img');
    expect(imgs.length).toBe(2);
    expect((imgs[0] as HTMLImageElement).getAttribute('src')).toBe('/a.png');
    expect((imgs[1] as HTMLImageElement).getAttribute('src')).toBe('/b.png');
  });

  it('clicking an app calls onOpenWindow with its windowId then closes', () => {
    const { props } = setup({
      apps: [makeIcon({ label: 'Run Me', windowId: 'run-me-win' })],
    });

    fireEvent.click(screen.getByText('Run Me'));

    expect(props.onOpenWindow).toHaveBeenCalledTimes(1);
    expect(props.onOpenWindow).toHaveBeenCalledWith('run-me-win');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking a nav link with a url navigates via window.location.assign and does not call onOpenExternal', () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, assign },
    });
    const navUrlLink = NAV_LINKS.find((l) => l.url)!;
    const { props } = setup();

    fireEvent.click(screen.getByText(navUrlLink.title));

    expect(assign).toHaveBeenCalledWith(navUrlLink.url);
    expect(props.onOpenExternal).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('clicking a nav link with a redirect calls onOpenExternal and does not navigate', () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, assign },
    });
    const navRedirectLink = NAV_LINKS.find((l) => l.redirect)!;
    const { props } = setup();

    fireEvent.click(screen.getByText(navRedirectLink.title));

    expect(props.onOpenExternal).toHaveBeenCalledWith(navRedirectLink.redirect);
    expect(assign).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('clicking a social link calls onOpenExternal with its url then closes', () => {
    const social = SOCIAL_LINKS[0];
    const { props } = setup();

    fireEvent.click(screen.getByText(social.label));

    expect(props.onOpenExternal).toHaveBeenCalledWith(social.url);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders all nav and social links', () => {
    setup();
    for (const link of NAV_LINKS) {
      expect(screen.getByText(link.title)).toBeTruthy();
    }
    for (const social of SOCIAL_LINKS) {
      expect(screen.getByText(social.label)).toBeTruthy();
    }
  });

  it('footer "cerrar ventanas" calls onCloseAllWindows then closes', () => {
    const { props } = setup();

    fireEvent.click(screen.getByText('cerrar ventanas'));

    expect(props.onCloseAllWindows).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('pressing Escape calls onClose', () => {
    const { props } = setup();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for non-Escape keys', () => {
    const { props } = setup();

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('a pointerdown outside the menu and anchor closes the menu', () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const { props } = setup();

    fireEvent.pointerDown(outside);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('a pointerdown inside the menu does not close it', () => {
    const { props } = setup();
    const menu = document.querySelector('[role="menu"]')!;

    fireEvent.pointerDown(menu);

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('a pointerdown on the anchor does not close the menu', () => {
    const { props, anchor } = setup();

    fireEvent.pointerDown(anchor);

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('focuses the first enabled button on mount', () => {
    setup({ apps: [makeIcon({ label: 'First App' })] });

    const firstButton = document.querySelector<HTMLButtonElement>(
      'section[aria-label="Programas"] button',
    );
    expect(firstButton).toBeTruthy();
    expect(document.activeElement).toBe(firstButton);
  });

  it('moves focus between menuitems with ArrowDown / ArrowUp', () => {
    setup({ apps: [makeIcon({ label: 'First App' })] });

    const items = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    expect(items.length).toBeGreaterThan(1);
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(items[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: 'End' });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('renders no app buttons when apps is empty but still renders links section', () => {
    const { container } = setup({ apps: [] });

    const appButtons = container.querySelectorAll('section[aria-label="Programas"] button');
    expect(appButtons.length).toBe(0);
    // links/social sections still present
    expect(screen.getByText(SOCIAL_LINKS[0].label)).toBeTruthy();
  });

  it('removes global listeners on unmount so later events do not call onClose', () => {
    const { props, unmount } = setup();
    unmount();

    fireEvent.keyDown(window, { key: 'Escape' });
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    fireEvent.pointerDown(outside);

    expect(props.onClose).not.toHaveBeenCalled();
  });
});
