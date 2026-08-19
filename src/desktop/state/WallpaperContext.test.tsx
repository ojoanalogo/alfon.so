import { renderHook, act } from '@testing-library/react';
import { STORAGE } from '@/lib/storage';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WallpaperProvider, useWallpaper } from './WallpaperContext';
import { ThemeProvider } from './ThemeContext';
import { DESKTOP_COLORS } from '../lib/desktopColors';
import type { WallpaperOption } from '../types';
import { stubMatchMedia } from '@test/helpers';

const WALLPAPERS: WallpaperOption[] = [
  { id: '01', label: 'Imagen 01', src: '/wp/01.jpg', thumbSrc: '/wp/01-thumb.jpg' },
  { id: '03', label: 'Imagen 03', src: '/wp/03.jpg', thumbSrc: '/wp/03-thumb.jpg' },
  { id: '05', label: 'Imagen 05', src: '/wp/05.jpg', thumbSrc: '/wp/05-thumb.jpg' },
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
    localStorage.setItem(STORAGE.wallpaper, '03');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBe('03');
    expect(result.current.activeWallpaper?.id).toBe('03');
  });

  it('clears an unknown stored wallpaper preference to plain background', () => {
    localStorage.setItem(STORAGE.wallpaper, '06');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(result.current.backgroundColorId).toBe('default');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
  });

  it('reads a stored valid background color', () => {
    localStorage.setItem(STORAGE.desktopColor, 'blue');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.backgroundColorId).toBe('blue');
  });

  it('normalizes an invalid stored background color to "default"', () => {
    localStorage.setItem(STORAGE.desktopColor, 'chartreuse');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });
    expect(result.current.backgroundColorId).toBe('default');
    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('default');
  });

  it('setWallpaper updates id and persists it', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('01');
    });

    expect(result.current.wallpaperId).toBe('01');
    expect(result.current.activeWallpaper?.id).toBe('01');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('01');
    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('default');
  });

  it('persists the current fill color when selecting a wallpaper', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setBackgroundColor('mint');
    });
    act(() => {
      result.current.setWallpaper('03');
    });

    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('03');
    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('mint');
    expect(result.current.backgroundColorId).toBe('mint');
  });

  it('restores a stored fill color alongside an active wallpaper preference', () => {
    localStorage.setItem(STORAGE.desktopColor, 'mint');
    localStorage.setItem(STORAGE.wallpaper, '03');
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    expect(result.current.wallpaperId).toBe('03');
    expect(result.current.backgroundColorId).toBe('mint');
  });

  it('setWallpaper(null) clears the wallpaper and persists empty string', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('03');
    });
    act(() => {
      result.current.setWallpaper(null);
    });

    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
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
      result.current.setWallpaper('03');
    });
    act(() => {
      result.current.setBackgroundColor('purple');
    });

    expect(result.current.backgroundColorId).toBe('purple');
    expect(localStorage.getItem(STORAGE.desktopColor)).toBe('purple');
    expect(result.current.wallpaperId).toBeNull();
    expect(result.current.activeWallpaper).toBeNull();
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
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

  it('setPattern clears wallpaper and persists pattern id', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setWallpaper('03');
    });
    act(() => {
      result.current.setPattern('dots');
    });

    expect(result.current.patternId).toBe('dots');
    expect(result.current.wallpaperId).toBeNull();
    expect(localStorage.getItem(STORAGE.desktopPattern)).toBe('dots');
    expect(localStorage.getItem(STORAGE.wallpaper)).toBe('');
  });

  it('setWallpaper clears an active pattern', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setPattern('grid');
    });
    act(() => {
      result.current.setWallpaper('01');
    });

    expect(result.current.wallpaperId).toBe('01');
    expect(result.current.patternId).toBeNull();
    expect(localStorage.getItem(STORAGE.desktopPattern)).toBe('');
  });

  it('setBackgroundColor keeps an active pattern', () => {
    const { result } = renderHook(() => useWallpaper(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setPattern('dots');
    });
    act(() => {
      result.current.setBackgroundColor('mint');
    });

    expect(result.current.patternId).toBe('dots');
    expect(result.current.backgroundColorId).toBe('mint');
    expect(result.current.wallpaperId).toBeNull();
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
      result.current.setWallpaper('03');
    });
    expect(result.current.status).toBe('loading');

    act(() => {
      instances[instances.length - 1]?.onerror?.();
    });

    expect(result.current.status).toBe('error');
  });
});
