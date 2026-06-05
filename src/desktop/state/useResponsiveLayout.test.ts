import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { makeWindowDef, makeWindowState } from '@test/factories';
import { setViewport, flushFrame } from '@test/helpers';
import { useResponsiveLayout } from './useResponsiveLayout';
import type { WindowManager } from './useWindowManager';
import type { WindowDef, WindowState } from '../types';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from '../lib/layoutConstants';

// jsdom defaults window.innerWidth to 1024 (desktop). We pin both dims so the
// hook's `window.innerWidth/Height` reads are deterministic.
const DESKTOP_VW = 1024;
const DESKTOP_VH = 768;
const MOBILE_VW = 390;
const MOBILE_VH = 800;

/**
 * Minimal WindowManager stub: useResponsiveLayout only destructures four
 * mutators and reads `windows` / `open`. Everything else is filled with no-ops
 * so the type checks but is never exercised.
 */
function makeWm(windows: Record<string, WindowState> = {}): WindowManager {
  const noop = vi.fn();
  return {
    windows,
    order: Object.keys(windows),
    focusedId: null,
    open: vi.fn(),
    close: noop,
    minimize: noop,
    toggleMaximize: noop,
    focus: noop,
    unfocus: noop,
    setUserGeometry: vi.fn(),
    correctLayout: vi.fn(),
    correctLayouts: vi.fn(),
    relayoutToViewport: vi.fn(),
  } as unknown as WindowManager;
}

beforeEach(() => {
  vi.useRealTimers();
  setViewport(DESKTOP_VW, DESKTOP_VH);
  document.body.className = '';
});

describe('useResponsiveLayout - return shape', () => {
  it('returns openWindow and fitWindowToMobile callbacks', () => {
    const wm = makeWm();
    const { result } = renderHook(() =>
      useResponsiveLayout(wm, [], { width: DESKTOP_VW, height: DESKTOP_VH }),
    );
    expect(typeof result.current.openWindow).toBe('function');
    expect(typeof result.current.fitWindowToMobile).toBe('function');
  });
});

describe('useResponsiveLayout - mobile geometry', () => {
  it('applies mobile geometry to open windows on a mobile viewport', () => {
    setViewport(MOBILE_VW, MOBILE_VH);
    const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultHeight: 400 })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: true, minimized: false }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: MOBILE_VW, height: MOBILE_VH }));

    expect(wm.correctLayouts).toHaveBeenCalled();
    const updates = (wm.correctLayouts as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    expect(updates.a).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
      width: MOBILE_VW - EDGE_MARGIN * 2,
      height: MOBILE_VH - TASKBAR_HEIGHT - EDGE_MARGIN * 2,
    });
  });

  it('does not push mobile geometry for closed windows', () => {
    setViewport(MOBILE_VW, MOBILE_VH);
    const defs: WindowDef[] = [makeWindowDef({ id: 'a' })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: false }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: MOBILE_VW, height: MOBILE_VH }));

    // No open and no defaultOpen window -> nothing to update.
    expect(wm.correctLayouts).not.toHaveBeenCalled();
  });

  it('applies mobile geometry to defaultOpen windows even when state is closed', () => {
    setViewport(MOBILE_VW, MOBILE_VH);
    const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultOpen: true })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: false }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: MOBILE_VW, height: MOBILE_VH }));

    expect(wm.correctLayouts).toHaveBeenCalled();
    const updates = (wm.correctLayouts as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    expect(updates.a).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
      width: MOBILE_VW - EDGE_MARGIN * 2,
      height: MOBILE_VH - TASKBAR_HEIGHT - EDGE_MARGIN * 2,
    });
  });

  it('uses relayoutToViewport (not mobile fit) on a desktop viewport', () => {
    const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultHeight: 400 })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: true }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: DESKTOP_VW, height: DESKTOP_VH }));

    expect(wm.relayoutToViewport).toHaveBeenCalledWith(DESKTOP_VW, DESKTOP_VH);
    expect(wm.correctLayouts).not.toHaveBeenCalled();
  });
});

describe('useResponsiveLayout - resize epoch', () => {
  it('re-runs the layout pass when the window resizes', async () => {
    const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultHeight: 400 })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: true }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: DESKTOP_VW, height: DESKTOP_VH }));

    const before = (wm.relayoutToViewport as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      // The resize handler bumps an epoch (state), which re-fires the layout
      // effect on the next commit.
      await flushFrame();
    });

    const after = (wm.relayoutToViewport as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(after).toBeGreaterThan(before);
  });
});

describe('useResponsiveLayout - fonts ready', () => {
  it('runs an extra layout pass when document.fonts.ready resolves', async () => {
    let resolveReady: () => void = () => {};
    const ready = new Promise<void>((r) => {
      resolveReady = r;
    });
    Object.defineProperty(document, 'fonts', { value: { ready }, configurable: true });

    try {
      const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultHeight: 400 })];
      const wm = makeWm({ a: makeWindowState({ id: 'a', open: false }) });
      renderHook(() => useResponsiveLayout(wm, defs, { width: DESKTOP_VW, height: DESKTOP_VH }));

      await act(async () => {
        await flushFrame();
      });
      const before = (wm.relayoutToViewport as ReturnType<typeof vi.fn>).mock.calls.length;

      // Fonts settling bumps the layout epoch → one more relayout pass.
      await act(async () => {
        resolveReady();
        await ready;
        await flushFrame();
      });

      const after = (wm.relayoutToViewport as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(after).toBeGreaterThan(before);
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });
});

describe('useResponsiveLayout - fitWindowToMobile', () => {
  it('sets mobile geometry for the given id from the live viewport', () => {
    setViewport(MOBILE_VW, MOBILE_VH);
    const wm = makeWm();
    const { result } = renderHook(() =>
      useResponsiveLayout(wm, [], { width: MOBILE_VW, height: MOBILE_VH }),
    );

    act(() => {
      result.current.fitWindowToMobile('a');
    });

    expect(wm.correctLayout).toHaveBeenCalledWith('a', {
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
      width: MOBILE_VW - EDGE_MARGIN * 2,
      height: MOBILE_VH - TASKBAR_HEIGHT - EDGE_MARGIN * 2,
    });
  });
});

describe('useResponsiveLayout - openWindow', () => {
  it('opens the window via wm.open without a second desktop layout pass', () => {
    const defs: WindowDef[] = [makeWindowDef({ id: 'a', defaultHeight: 400 })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: false }) });
    const { result } = renderHook(() =>
      useResponsiveLayout(wm, defs, { width: DESKTOP_VW, height: DESKTOP_VH }),
    );

    act(() => {
      result.current.openWindow('a');
    });

    // wm.open fully places a fresh open, so the desktop path does no extra work
    // and never falls back to the per-id mobile fit.
    expect(wm.open).toHaveBeenCalledWith('a');
    expect(wm.correctLayout).not.toHaveBeenCalled();
  });

  it('opens then fits to mobile on a mobile viewport', () => {
    setViewport(MOBILE_VW, MOBILE_VH);
    const defs: WindowDef[] = [makeWindowDef({ id: 'a' })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: false }) });
    const { result } = renderHook(() =>
      useResponsiveLayout(wm, defs, { width: MOBILE_VW, height: MOBILE_VH }),
    );

    act(() => {
      result.current.openWindow('a');
    });

    expect(wm.open).toHaveBeenCalledWith('a');
    expect(wm.correctLayout).toHaveBeenCalledWith('a', expect.objectContaining({ x: EDGE_MARGIN }));
  });
});

describe('useResponsiveLayout - viewport guard', () => {
  it('skips the layout pass when the browser reports a zero viewport', () => {
    setViewport(0, 0);
    const defs: WindowDef[] = [makeWindowDef({ id: 'a' })];
    const wm = makeWm({ a: makeWindowState({ id: 'a', open: true }) });

    renderHook(() => useResponsiveLayout(wm, defs, { width: 0, height: 0 }));

    expect(wm.relayoutToViewport).not.toHaveBeenCalled();
    expect(wm.correctLayouts).not.toHaveBeenCalled();
  });
});
