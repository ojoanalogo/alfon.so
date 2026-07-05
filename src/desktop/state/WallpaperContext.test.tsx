import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WallpaperProvider, useWallpaper } from './WallpaperContext';
import { ThemeProvider } from './ThemeContext';
import { DESKTOP_COLORS } from '../lib/desktopColors';
import type { WallpaperOption } from '../types';
import { DEFAULT_WALLPAPER_ID } from '@/config/wallpapers';
import { stubMatchMedia } from '@test/helpers';

const WALLPAPERS: WallpaperOption[] = [
  { id: '1', label: 'One', src: '/wp/1.jpg', thumbSrc: '/wp/1-thumb.jpg' },
  { id: '4', label: 'Four', src: '/wp/4.jpg', thumbSrc: '/wp/4-thumb.jpg' },
  { id: '7', label: 'Seven', src: '/wp/7.jpg', thumbSrc: '/wp/7-thumb.jpg' },
  { id: DEFAULT_WALLPAPER_ID, label: 'Default', src: '/wp/11.jpg', thumbSrc: '/wp/11-thumb.jpg' },
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

  it('defaults to plain background color when no preference is stored', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(result.current.backgroundColorId).toBe('default');
    expect(result.current.status).toBe('ready');
    expect(result.current.bootContentReady).toBe(true);
  });

  it('reads a stored wallpaper id', () => {
    localStorage.setItem('devfolio.wallpaper', '7');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('7');
    expect(result.current.activeWallpaper?.id).toBe('7');
  });

  it('normalizes an unknown stored wallpaper id to the fallback default', () => {
    localStorage.setItem('devfolio.wallpaper', 'nope');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe(DEFAULT_WALLPAPER_ID);
    expect(localStorage.getItem('devfolio.wallpaper')).toBe(DEFAULT_WALLPAPER_ID);
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
      result.current.setWallpaper('4');
    });
    act(() => {
      result.current.setWallpaper(null);
    });

    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
  });

  it('setWallpaper ignores an id not present in wallpapers', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('does-not-exist');
    });

    expect(result.current.wallpaperId).toBeNull();
  });

  it('setBackgroundColor updates color, persists it, and clears the wallpaper', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('4');
    });
    act(() => {
      result.current.setBackgroundColor('purple');
    });

    expect(result.current.backgroundColorId).toBe('purple');
    expect(localStorage.getItem('devfolio.desktop-color')).toBe('purple');
    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem('devfolio.wallpaper')).toBe('');
  });

  it('setBackgroundColor ignores an invalid color id', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    const beforeColor = result.current.backgroundColorId;

    act(() => {
      result.current.setBackgroundColor('not-a-color');
    });

    expect(result.current.backgroundColorId).toBe(beforeColor);
    expect(result.current.wallpaperId).toBeNull();
  });

  it('desktopBackgroundColor resolves "default" to the theme token and a color id to its hex', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.desktopBackgroundColor).toBe('var(--color-background)');

    act(() => {
      result.current.setBackgroundColor('mint');
    });

    expect(result.current.desktopBackgroundColor).toBe('#2dd4bf');
  });

  it('reports error status when the active wallpaper image fails to load', () => {
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

    act(() => {
      result.current.setWallpaper('4');
    });
    expect(result.current.status).toBe('loading');

    act(() => {
      instances[instances.length - 1]?.onerror?.();
    });

    expect(result.current.status).toBe('error');
  });
});
