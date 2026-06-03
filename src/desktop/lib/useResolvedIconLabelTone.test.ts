import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Control the wallpaper context that the hook reads from. Only iconLabelTone
// is consumed, so a partial mock object is sufficient.
const useWallpaperMock = vi.fn();
vi.mock('../state/WallpaperContext', () => ({
  useWallpaper: () => useWallpaperMock(),
}));

import { useResolvedIconLabelTone } from './useResolvedIconLabelTone';

afterEach(() => {
  useWallpaperMock.mockReset();
});

describe('useResolvedIconLabelTone', () => {
  it('returns the dark tone exposed by the wallpaper context', () => {
    useWallpaperMock.mockReturnValue({ iconLabelTone: 'dark' });
    const { result } = renderHook(() => useResolvedIconLabelTone());
    expect(result.current).toBe('dark');
  });

  it('returns the light tone exposed by the wallpaper context', () => {
    useWallpaperMock.mockReturnValue({ iconLabelTone: 'light' });
    const { result } = renderHook(() => useResolvedIconLabelTone());
    expect(result.current).toBe('light');
  });

  it('reflects an updated tone when the context value changes between renders', () => {
    useWallpaperMock.mockReturnValue({ iconLabelTone: 'dark' });
    const { result, rerender } = renderHook(() => useResolvedIconLabelTone());
    expect(result.current).toBe('dark');

    useWallpaperMock.mockReturnValue({ iconLabelTone: 'light' });
    rerender();
    expect(result.current).toBe('light');
  });

  it('propagates the provider-missing error thrown by useWallpaper', () => {
    useWallpaperMock.mockImplementation(() => {
      throw new Error('useWallpaper must be used within WallpaperProvider');
    });
    expect(() => renderHook(() => useResolvedIconLabelTone())).toThrow(
      'useWallpaper must be used within WallpaperProvider',
    );
  });
});
