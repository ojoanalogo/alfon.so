import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createRef } from 'react';
import { useWindowCenterLayout } from './useWindowCenterLayout';
import { TASKBAR_HEIGHT, EDGE_MARGIN } from '../lib/layoutConstants';

// jsdom: getBoundingClientRect returns all-zeros by default, so we mock it per
// element. window.innerWidth defaults to 1024; we pin both dims for determinism.
const VW = 1024;
const VH = 768;

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
    writable: true,
  });
}

/** Build a detached element whose measured box is fixed at the given size. */
function elWithRect(width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect;
  return el;
}

interface Args {
  el?: HTMLElement | null;
  enabled?: boolean;
  x?: number;
  y?: number;
  width?: number;
  onGeometryChange?: Mock<(geometry: { x?: number; y?: number; width?: number }) => void>;
}

function renderCenter(args: Args = {}) {
  const onGeometryChange =
    args.onGeometryChange ??
    vi.fn<(geometry: { x?: number; y?: number; width?: number }) => void>();
  const ref = createRef<HTMLElement>();
  // createRef.current is read-only typed; assign through Object to set the node.
  (ref as { current: HTMLElement | null }).current =
    args.el === undefined ? elWithRect(600, 400) : args.el;
  const utils = renderHook(() =>
    useWindowCenterLayout({
      rootRef: ref,
      enabled: args.enabled ?? true,
      x: args.x ?? 0,
      y: args.y ?? 0,
      width: args.width ?? 600,
      onGeometryChange,
    }),
  );
  return { ...utils, onGeometryChange, ref };
}

// jsdom does not implement ResizeObserver; the hook constructs one. A no-op
// stub lets the effect mount without changing observable behavior (we drive
// updates via rAF / resize events directly).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.useRealTimers();
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
  setViewport(VW, VH);
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('useWindowCenterLayout - centered geometry', () => {
  it('reports a centered position via onGeometryChange for a centered window', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });

    expect(onGeometryChange).toHaveBeenCalled();
    const geo = onGeometryChange.mock.calls[0][0];
    // Center math mirrors the hook: (vw - w) / 2, (vh - taskbar - h) / 2.
    expect(geo.x).toBe(Math.round(Math.max(EDGE_MARGIN, (VW - 600) / 2)));
    expect(geo.y).toBe(Math.round(Math.max(EDGE_MARGIN, (VH - TASKBAR_HEIGHT - 400) / 2)));
    expect(geo.width).toBe(600);
  });

  it('exposes the centered position through displayX/displayY', () => {
    const { result } = renderCenter({ el: elWithRect(600, 400) });
    expect(result.current.displayX).toBe(Math.round((VW - 600) / 2));
    expect(result.current.displayY).toBe(Math.round((VH - TASKBAR_HEIGHT - 400) / 2));
  });

  it('clamps to EDGE_MARGIN when the window is wider/taller than the viewport', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(VW + 400, VH + 400) });
    const geo = onGeometryChange.mock.calls[0][0];
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.y).toBe(EDGE_MARGIN);
  });
});

describe('useWindowCenterLayout - idempotence', () => {
  it('does not re-report when the synchronous rAF passes resolve to the same box', async () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    const callsAfterMount = onGeometryChange.mock.calls.length;
    expect(callsAfterMount).toBe(1);

    // Let the queued rAF passes (raf1, raf2) run; the box is unchanged so they
    // must not push a duplicate geometry upstream.
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    expect(onGeometryChange.mock.calls.length).toBe(callsAfterMount);
  });
});

describe('useWindowCenterLayout - guards', () => {
  it('does nothing when disabled', () => {
    const { onGeometryChange, result } = renderCenter({ el: elWithRect(600, 400), enabled: false });
    expect(onGeometryChange).not.toHaveBeenCalled();
    // displayX/Y fall back to the passed x/y when not locked and disabled.
    expect(result.current.displayX).toBe(0);
    expect(result.current.displayY).toBe(0);
  });

  it('does nothing when the ref has no node', () => {
    const { onGeometryChange } = renderCenter({ el: null });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does not report while the body has is-window-gesturing', () => {
    document.body.classList.add('is-window-gesturing');
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('skips reporting when the measured box has zero size', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(0, 0) });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });
});

describe('useWindowCenterLayout - user positioning', () => {
  it('locks displayX/displayY to the props once markUserPositioned is called', () => {
    const { result, rerender } = renderHookWithProps();

    act(() => {
      result.current.markUserPositioned();
    });

    // After locking, displayX/Y track the incoming x/y, not the centered box.
    rerender({ x: 123, y: 321 });
    expect(result.current.displayX).toBe(123);
    expect(result.current.displayY).toBe(321);
  });

  it('stops reporting geometry after the user positions the window', async () => {
    const onGeometryChange = vi.fn();
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement | null }).current = elWithRect(600, 400);
    const { result } = renderHook(() =>
      useWindowCenterLayout({
        rootRef: ref,
        enabled: true,
        x: 0,
        y: 0,
        width: 600,
        onGeometryChange,
      }),
    );

    const before = onGeometryChange.mock.calls.length;
    act(() => {
      result.current.markUserPositioned();
    });

    // Fire a resize: syncPosition should early-return because userPositioned.
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    expect(onGeometryChange.mock.calls.length).toBe(before);
  });
});

// Helper for the lock test: needs a stable element across rerenders and the
// ability to vary x/y props.
function renderHookWithProps() {
  const onGeometryChange = vi.fn();
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current = elWithRect(600, 400);
  return renderHook(
    ({ x, y }: { x: number; y: number }) =>
      useWindowCenterLayout({
        rootRef: ref,
        enabled: true,
        x,
        y,
        width: 600,
        onGeometryChange,
      }),
    { initialProps: { x: 0, y: 0 } },
  );
}
