import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { makeWindowState } from '@test/factories';
import { useWindowWidthSync } from './useWindowWidthSync';
import type { WindowState } from '../types';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

afterEach(() => {
  setViewportWidth(1024); // restore the jsdom default for other tests
});

// jsdom window.innerWidth defaults to 1024, so defaultWidth 600 resolves to 600.
function run(stateOverrides: Partial<WindowState> = {}, opts: { center?: boolean } = {}) {
  const onGeometryChange = vi.fn();
  const state = makeWindowState({ open: true, width: 800, ...stateOverrides });
  const utils = renderHook(() =>
    useWindowWidthSync({
      state,
      defaultWidth: 600,
      minWidth: 400,
      center: opts.center ?? false,
      onGeometryChange,
    }),
  );
  return { ...utils, onGeometryChange };
}

describe('useWindowWidthSync', () => {
  it('returns the app-default width when not user-sized', () => {
    expect(run({ width: 800, userSized: false }).result.current).toBe(600);
  });

  it('returns the stored width when user-sized', () => {
    expect(run({ width: 800, userSized: true }).result.current).toBe(800);
  });

  it('corrects a drifted width via onGeometryChange', () => {
    expect(run({ width: 800, userSized: false }).onGeometryChange).toHaveBeenCalledWith({
      width: 600,
    });
  });

  it('does not correct when user-sized', () => {
    expect(run({ width: 800, userSized: true }).onGeometryChange).not.toHaveBeenCalled();
  });

  it('does not correct centered windows', () => {
    expect(
      run({ width: 800, userSized: false }, { center: true }).onGeometryChange,
    ).not.toHaveBeenCalled();
  });

  it('does not correct when already within 1px', () => {
    expect(run({ width: 600, userSized: false }).onGeometryChange).not.toHaveBeenCalled();
  });

  it('corrects the painted width when the viewport shrinks below it', async () => {
    const onGeometryChange = vi.fn();
    // defaultWidth 1000 fits the 1024 jsdom viewport, so initial layout = 1000.
    const state = makeWindowState({ open: true, width: 1000, userSized: false });
    const { result } = renderHook(() =>
      useWindowWidthSync({
        state,
        defaultWidth: 1000,
        minWidth: 400,
        center: false,
        onGeometryChange,
      }),
    );
    expect(result.current).toBe(1000);
    onGeometryChange.mockClear();

    // Desktop shrink: the window's painted width must follow the viewport down.
    setViewportWidth(800);
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    // clampWidth(1000, 400, 800) = min(1000, 800 - 16) = 784
    expect(result.current).toBe(784);
    expect(onGeometryChange).toHaveBeenLastCalledWith({ width: 784 });
  });

  it('does not correct closed, minimized, or maximized windows', () => {
    expect(run({ width: 800, open: false }).onGeometryChange).not.toHaveBeenCalled();
    expect(run({ width: 800, minimized: true }).onGeometryChange).not.toHaveBeenCalled();
    expect(run({ width: 800, maximized: true }).onGeometryChange).not.toHaveBeenCalled();
  });
});
