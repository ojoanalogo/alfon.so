import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WallpaperProvider, useWallpaper } from './WallpaperContext';
import { ThemeProvider } from './ThemeContext';
import { DESKTOP_COLORS } from '../lib/desktopColors';
import type { WallpaperOption } from '../types';
import { stubMatchMedia } from '@test/helpers';

const WALLPAPERS: WallpaperOption[] = [
  { id: '1', label: 'One', src: '/wp/1.jpg', thumbSrc: '/wp/1-thumb.jpg' },
  { id: '4', label: 'Four', src: '/wp/4.jpg', thumbSrc: '/wp/4-thumb.jpg' },
  { id: '7', label: 'Seven', src: '/wp/7.jpg', thumbSrc: '/wp/7-thumb.jpg' },
];

function makeWrapper(wallpapers: WallpaperOption[] = WALLPAPERS) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <WallpaperProvider wallpapers={wallpapers}>{children}</WallpaperProvider>
      </ThemeProvider>
    );
  };
}

beforeEach(() => {
  localStorage.clear();
  // ThemeProvider (wrapping WallpaperProvider) calls matchMedia, absent in jsdom.
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('WallpaperProvider + useWallpaper', () => {
  it('throws when useWallpaper is used outside the provider', () => {
    expect(() => renderHook(() => useWallpaper())).toThrow(
      'useWallpaper must be used within WallpaperProvider',
    );
  });

  it('exposes the provided wallpapers and DESKTOP_COLORS', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpapers).toEqual(WALLPAPERS);
    expect(result.current.desktopColors).toBe(DESKTOP_COLORS);
  });

  it('defaults to wallpaper id "4" when no preference is stored', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('4');
    expect(result.current.activeWallpaper?.id).toBe('4');
    expect(result.current.backgroundColorId).toBe('default');
  });

  it('falls back to the lowest numeric id when default "4" is unavailable', () => {
    const subset: WallpaperOption[] = [
      { id: '7', label: 'Seven', src: '/wp/7.jpg', thumbSrc: '/wp/7-t.jpg' },
      { id: '2', label: 'Two', src: '/wp/2.jpg', thumbSrc: '/wp/2-t.jpg' },
    ];
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper(subset) });
    expect(result.current.wallpaperId).toBe('2');
  });

  it('reads a stored wallpaper id', () => {
    localStorage.setItem('devfolio.wallpaper', '7');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('7');
    expect(result.current.activeWallpaper?.id).toBe('7');
  });

  it('treats an empty stored wallpaper value as unset (falls back to default)', () => {
    // Quirk: readWallpaperPreference guards with `!getItem(...)`, so an empty
    // string is falsy → 'unset', not 'color'. It resolves to the default id.
    localStorage.setItem('devfolio.wallpaper', '');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('4');
    expect(result.current.activeWallpaper?.id).toBe('4');
  });

  it('normalizes an unknown stored wallpaper id back to the default', () => {
    localStorage.setItem('devfolio.wallpaper', 'nope');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('4');
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('4');
  });

  it('reads a stored valid background color', () => {
    localStorage.setItem('devfolio.desktop-color', 'blue');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.backgroundColorId).toBe('blue');
  });

  it('normalizes an invalid stored background color to "default"', () => {
    localStorage.setItem('devfolio.desktop-color', 'chartreuse');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.backgroundColorId).toBe('default');
    expect(localStorage.getItem('devfolio.desktop-color')).toBe('default');
  });

  it('setWallpaper updates id and persists it', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('1');
    });

    expect(result.current.wallpaperId).toBe('1');
    expect(result.current.activeWallpaper?.id).toBe('1');
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('1');
  });

  it('setWallpaper(null) clears the wallpaper and persists empty string', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper(null);
    });

    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
  });

  it('setWallpaper ignores an id not present in wallpapers', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    const before = result.current.wallpaperId;

    act(() => {
      result.current.setWallpaper('does-not-exist');
    });

    expect(result.current.wallpaperId).toBe(before);
  });

  it('setBackgroundColor updates color, persists it, and clears the wallpaper', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('4');

    act(() => {
      result.current.setBackgroundColor('purple');
    });

    expect(result.current.backgroundColorId).toBe('purple');
    expect(localStorage.getItem('devfolio.desktop-color')).toBe('purple');
    // Setting a color clears the active wallpaper.
    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
  });

  it('setBackgroundColor ignores an invalid color id', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    const beforeColor = result.current.backgroundColorId;
    const beforeWallpaper = result.current.wallpaperId;

    act(() => {
      result.current.setBackgroundColor('not-a-color');
    });

    expect(result.current.backgroundColorId).toBe(beforeColor);
    // Wallpaper untouched because the invalid call returns early.
    expect(result.current.wallpaperId).toBe(beforeWallpaper);
  });

  it('desktopBackgroundColor resolves "default" to the theme token and a color id to its hex', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.desktopBackgroundColor).toBe('var(--color-background)');

    act(() => {
      result.current.setBackgroundColor('mint');
    });

    expect(result.current.desktopBackgroundColor).toBe('#2dd4bf');
  });

  it('reports ready status when no wallpaper is active', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    // Clearing the wallpaper (color mode) leaves nothing to load → ready.
    act(() => {
      result.current.setWallpaper(null);
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.bootContentReady).toBe(true);
  });

  it('reports error status when the active wallpaper image fails to load', () => {
    // Capture each constructed Image so the test can fire its onerror handler.
    const instances: Array<{ onerror: (() => void) | null }> = [];
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src = '';
      constructor() {
        instances.push(this);
      }
      set src(value: string) {
        this._src = value;
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', FakeImage);

    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    // Default wallpaper '4' is active → the load effect constructs an Image.
    expect(result.current.status).toBe('loading');

    act(() => {
      instances[instances.length - 1]?.onerror?.();
    });

    expect(result.current.status).toBe('error');
  });
});
