import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import DesktopWallpaper from './Wallpaper';
import { WallpaperProvider } from '../state/WallpaperContext';
import { ThemeProvider } from '../state/ThemeContext';
import type { WallpaperOption } from '../types';
import { makeWallpaperOption } from '@test/factories';
import { stubMatchMedia } from '@test/helpers';

function renderWallpaper(wallpapers: WallpaperOption[]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <WallpaperProvider wallpapers={wallpapers}>{children}</WallpaperProvider>
    </ThemeProvider>
  );
  return render(<DesktopWallpaper />, { wrapper });
}

describe('DesktopWallpaper', () => {
  beforeEach(() => {
    localStorage.clear();
    // ThemeProvider (wrapping WallpaperProvider) calls matchMedia, absent in jsdom.
    stubMatchMedia();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders a decorative background container', () => {
    const { container } = renderWallpaper([]);

    const background = container.firstElementChild as HTMLElement;
    expect(background).toBeTruthy();
    expect(background.getAttribute('aria-hidden')).toBe('true');
    expect(background.className).toContain('absolute');
    expect(background.className).toContain('inset-0');
  });

  it('applies the resolved desktop background color when no wallpaper is active', () => {
    // No wallpapers -> activeWallpaper is null -> "default" color resolves to the
    // theme background token.
    const { container } = renderWallpaper([]);

    const background = container.firstElementChild as HTMLElement;
    expect(background.style.backgroundColor).toBe('var(--color-background)');
  });

  it('does not render an image while the active wallpaper is still loading', () => {
    // localStorage points at a wallpaper, but the Image() never fires onload in
    // jsdom, so status stays "loading" and the <img> must not appear.
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const { container } = renderWallpaper([makeWallpaperOption()]);

    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the wallpaper image once the image has loaded (status ready)', async () => {
    // Drive the Image load synchronously so status flips to "ready".
    const wallpaper = makeWallpaperOption({ id: 'wp-1', src: '/wallpapers/wp-1.jpg' });

    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src = '';
      set src(value: string) {
        this._src = value;
        // Fire load on the next microtask so React effects have committed.
        queueMicrotask(() => this.onload?.());
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);

    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const { container } = renderWallpaper([wallpaper]);

    const img = await waitFor(() => {
      const found = container.querySelector('img');
      expect(found).toBeTruthy();
      return found as HTMLImageElement;
    });

    expect(img.getAttribute('src')).toBe('/wallpapers/wp-1.jpg');
    // Decorative image: empty alt, async decoding.
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('does not render an image when a wallpaper id is stored but unavailable', () => {
    // Stored id is not in the provided wallpaper list -> resolves to no wallpaper.
    localStorage.setItem('devfolio.wallpaper', 'missing');
    const { container } = renderWallpaper([makeWallpaperOption({ id: 'wp-1' })]);

    expect(container.querySelector('img')).toBeNull();
    const background = container.firstElementChild as HTMLElement;
    expect(background.style.backgroundColor).toBe('var(--color-background)');
  });

  it('uses a concrete color value when a desktop color preference is stored', () => {
    // Selecting a color clears the wallpaper, so the background uses the literal hex.
    localStorage.setItem('devfolio.wallpaper', '');
    localStorage.setItem('devfolio.desktop-color', 'blue');
    const { container } = renderWallpaper([makeWallpaperOption()]);

    const background = container.firstElementChild as HTMLElement;
    expect(background.style.backgroundColor).toBe('rgb(96, 165, 250)');
    expect(container.querySelector('img')).toBeNull();
  });
});
