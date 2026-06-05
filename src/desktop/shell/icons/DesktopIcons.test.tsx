import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect, useRef, type RefObject } from 'react';
import DesktopIcons from './DesktopIcons';
import { useDesktopIcons, type DesktopIconsState } from '../../state/useDesktopIcons';
import { ThemeProvider } from '../../state/ThemeContext';
import { WallpaperProvider } from '../../state/WallpaperContext';
import { type DesktopIcon } from '@/config';
import type { WallpaperOption } from '../../types';
import { stubMatchMedia } from '@test/helpers';

const WALLPAPERS: WallpaperOption[] = [];

function makeIcon(overrides: Partial<DesktopIcon> = {}): DesktopIcon {
  return {
    id: 'notepad',
    label: 'Notepad',
    windowId: 'notepad-window',
    iconSrc: '/icons/notepad.png',
    ...overrides,
  };
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WallpaperProvider wallpapers={WALLPAPERS}>{children}</WallpaperProvider>
    </ThemeProvider>
  );
}

interface HarnessProps {
  icons: DesktopIcon[];
  onOpenWindow?: (windowId: string) => void;
  onDesktopClick?: () => void;
  /** Captures the live state object so tests can assert on it. */
  stateRef?: { current: DesktopIconsState | null };
}

/** Drives DesktopIcons with the real useDesktopIcons hook. */
function Harness({ icons, onOpenWindow, onDesktopClick, stateRef }: HarnessProps) {
  const state = useDesktopIcons(icons);
  useEffect(() => {
    if (stateRef) stateRef.current = state;
  });
  const trashRef = useRef<HTMLElement | null>(null);
  const suppressTrashClickRef = useRef(false);
  return (
    <DesktopIcons
      state={state}
      onOpenWindow={onOpenWindow ?? (() => {})}
      onDesktopClick={onDesktopClick}
      trashRef={trashRef as RefObject<HTMLElement | null>}
      suppressTrashClickRef={suppressTrashClickRef as RefObject<boolean>}
    />
  );
}

function renderIcons(
  opts: Omit<HarnessProps, 'stateRef'> & { stateRef?: HarnessProps['stateRef'] },
) {
  return render(
    <Providers>
      <Harness {...opts} />
    </Providers>,
  );
}

describe('DesktopIcons', () => {
  beforeEach(() => {
    localStorage.clear();
    // ThemeProvider (wrapping WallpaperProvider) calls matchMedia, absent in jsdom.
    stubMatchMedia();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders one button per visible icon', () => {
    const icons = [
      makeIcon({ id: 'a', label: 'Alpha', windowId: 'win-a' }),
      makeIcon({ id: 'b', label: 'Beta', windowId: 'win-b' }),
    ];
    const { container } = renderIcons({ icons });
    const buttons = container.querySelectorAll('button.desktop-icon');
    expect(buttons.length).toBe(2);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('renders the icon image with src and the label', () => {
    const { container } = renderIcons({
      icons: [makeIcon({ label: 'Notes', iconSrc: '/icons/notes.png' })],
    });
    const img = container.querySelector('.desktop-icon__glyph img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/icons/notes.png');
    expect(screen.getByText('Notes')).toBeTruthy();
  });

  it('uses tooltip for aria-label/title when provided, label otherwise', () => {
    const { container } = renderIcons({
      icons: [
        makeIcon({ id: 'a', label: 'Alpha', tooltip: 'Open Alpha' }),
        makeIcon({ id: 'b', label: 'Beta' }),
      ],
    });
    const buttons = container.querySelectorAll('button.desktop-icon');
    const a = buttons[0];
    const b = buttons[1];
    expect(a.getAttribute('aria-label')).toBe('Open Alpha');
    expect(a.getAttribute('title')).toBe('Open Alpha');
    expect(b.getAttribute('aria-label')).toBe('Beta');
  });

  it('selects an icon on single click (selectOnly)', () => {
    const stateRef: { current: DesktopIconsState | null } = { current: null };
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' }), makeIcon({ id: 'b', label: 'Beta' })],
      stateRef,
    });
    const buttons = container.querySelectorAll('button.desktop-icon');
    fireEvent.click(buttons[0]);
    expect(stateRef.current?.isSelected('a')).toBe(true);
    expect(stateRef.current?.isSelected('b')).toBe(false);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].className).toContain('is-selected');
  });

  it('toggles selection with a modifier-click instead of replacing it', () => {
    const stateRef: { current: DesktopIconsState | null } = { current: null };
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' }), makeIcon({ id: 'b', label: 'Beta' })],
      stateRef,
    });
    const buttons = container.querySelectorAll('button.desktop-icon');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1], { metaKey: true });
    expect(stateRef.current?.isSelected('a')).toBe(true);
    expect(stateRef.current?.isSelected('b')).toBe(true);
    // meta-click again toggles off
    fireEvent.click(buttons[1], { metaKey: true });
    expect(stateRef.current?.isSelected('b')).toBe(false);
  });

  it('opens the window on double-click (two fast synchronous clicks)', () => {
    // Two synchronous fireEvent clicks land within the DOUBLE_CLICK_MS window
    // (jsdom assigns near-identical event.timeStamp values).
    const onOpenWindow = vi.fn();
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha', windowId: 'win-a' })],
      onOpenWindow,
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenWindow).toHaveBeenCalledTimes(1);
    expect(onOpenWindow).toHaveBeenCalledWith('win-a');
  });

  it('opens the window on Enter (keyboard activation)', () => {
    const onOpenWindow = vi.fn();
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha', windowId: 'win-a' })],
      onOpenWindow,
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onOpenWindow).toHaveBeenCalledTimes(1);
    expect(onOpenWindow).toHaveBeenCalledWith('win-a');
  });

  it('does not open the window on a single click', () => {
    const onOpenWindow = vi.fn();
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', windowId: 'win-a' })],
      onOpenWindow,
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.click(button);
    expect(onOpenWindow).not.toHaveBeenCalled();
  });

  it('does not open a window for an icon without a windowId', () => {
    const onOpenWindow = vi.fn();
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', windowId: '' })],
      onOpenWindow,
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenWindow).not.toHaveBeenCalled();
  });

  it('opens an icon context menu with Abrir and Eliminar items', () => {
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' })],
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.contextMenu(button, { clientX: 50, clientY: 60 });
    const menu = document.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(screen.getByText('Abrir')).toBeTruthy();
    expect(screen.getByText('Eliminar')).toBeTruthy();
  });

  it('context-menu Abrir activates the window', () => {
    const onOpenWindow = vi.fn();
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', windowId: 'win-a' })],
      onOpenWindow,
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.contextMenu(button, { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByText('Abrir'));
    expect(onOpenWindow).toHaveBeenCalledWith('win-a');
  });

  it('context-menu Eliminar removes the icon from the visible set', () => {
    const stateRef: { current: DesktopIconsState | null } = { current: null };
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' }), makeIcon({ id: 'b', label: 'Beta' })],
      stateRef,
    });
    const button = container.querySelectorAll('button.desktop-icon')[0] as HTMLButtonElement;
    fireEvent.contextMenu(button, { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByText('Eliminar'));
    expect(stateRef.current?.visibleIcons.map((i) => i.id)).toEqual(['b']);
    expect(stateRef.current?.deletedCount).toBe(1);
    expect(container.querySelectorAll('button.desktop-icon').length).toBe(1);
  });

  it('shows a pluralized delete label when multiple icons are selected', () => {
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' }), makeIcon({ id: 'b', label: 'Beta' })],
    });
    const buttons = container.querySelectorAll('button.desktop-icon');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1], { metaKey: true });
    fireEvent.contextMenu(buttons[1], { clientX: 10, clientY: 10 });
    expect(screen.getByText('Eliminar (2)')).toBeTruthy();
  });

  it('opens the desktop context menu with Actualizar and Restaurar iconos', () => {
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a' })],
    });
    const surface = container.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.contextMenu(surface, { clientX: 30, clientY: 40 });
    expect(screen.getByText('Actualizar')).toBeTruthy();
    const restore = screen.getByText('Restaurar iconos') as HTMLButtonElement;
    expect(restore).toBeTruthy();
    // Nothing deleted yet -> restore disabled.
    expect(restore.disabled).toBe(true);
  });

  it('enables Restaurar iconos after an icon has been deleted, and restores it', () => {
    const stateRef: { current: DesktopIconsState | null } = { current: null };
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' })],
      stateRef,
    });
    // delete via icon context menu
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    fireEvent.contextMenu(button, { clientX: 5, clientY: 5 });
    fireEvent.click(screen.getByText('Eliminar'));
    expect(stateRef.current?.visibleIcons.length).toBe(0);

    // open desktop menu and restore
    const surface = container.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.contextMenu(surface, { clientX: 30, clientY: 40 });
    const restore = screen.getByText('Restaurar iconos') as HTMLButtonElement;
    expect(restore.disabled).toBe(false);
    fireEvent.click(restore);
    expect(stateRef.current?.visibleIcons.map((i) => i.id)).toEqual(['a']);
    expect(container.querySelectorAll('button.desktop-icon').length).toBe(1);
  });

  it('renders nothing in the icon layer when there are no icons', () => {
    const { container } = renderIcons({ icons: [] });
    expect(container.querySelectorAll('button.desktop-icon').length).toBe(0);
    // The desktop surface still renders.
    expect(container.querySelector('[aria-label="Iconos de escritorio"]')).toBeTruthy();
  });

  it('applies the icon position from state as inline left/top', () => {
    const { container } = renderIcons({
      icons: [makeIcon({ id: 'a', label: 'Alpha' })],
    });
    const button = container.querySelector('button.desktop-icon') as HTMLButtonElement;
    // BASE_X / BASE_Y default layout starts at 16,16
    expect(button.style.left).toBe('16px');
    expect(button.style.top).toBe('16px');
  });
});
