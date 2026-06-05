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

interface Args {
  el?: HTMLElement | null;
  enabled?: boolean;
  userSized?: boolean;
  width?: number;
  onGeometryChange?: Mock<(geometry: { x?: number; y?: number; width?: number }) => void>;
}

function renderCenter(args: Args = {}) {
  const onGeometryChange =
    args.onGeometryChange ??
    vi.fn<(geometry: { x?: number; y?: number; width?: number }) => void>();
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current =
    args.el === undefined ? elWithRect(600, 400) : args.el;
  const utils = renderHook(
    ({ enabled, userSized, width }: { enabled: boolean; userSized?: boolean; width: number }) =>
      useWindowCenterLayout({ rootRef: ref, enabled, userSized, width, onGeometryChange }),
    { initialProps: { enabled: args.enabled ?? true, userSized: args.userSized, width: args.width ?? 600 } },
  );
  return { ...utils, onGeometryChange, ref };
}

describe('useWindowCenterLayout - centered corrector', () => {
  it('reports the centered frame for an enabled, not-user-sized window', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange).toHaveBeenCalled();
    const geo = onGeometryChange.mock.calls[0][0];
    expect(geo.x).toBe(Math.round(Math.max(EDGE_MARGIN, (VW - 600) / 2)));
    expect(geo.y).toBe(Math.round(Math.max(EDGE_MARGIN, (VH - TASKBAR_HEIGHT - 400) / 2)));
    expect(geo.width).toBe(600);
  });

  it('clamps to EDGE_MARGIN when wider/taller than the viewport', () => {
    const { onGeometryChange } = renderCenter({ el: elWithRect(VW + 400, VH + 400) });
    const geo = onGeometryChange.mock.calls[0][0];
    expect(geo.x).toBe(EDGE_MARGIN);
    expect(geo.y).toBe(EDGE_MARGIN);
  });

  it('does not re-report when the rAF passes resolve to the same box', async () => {
    // The hook's own rAFs have already resolved at mount (jsdom flushes them), so this asserts no EXTRA report fires on further frames.
    const { onGeometryChange } = renderCenter({ el: elWithRect(600, 400) });
    expect(onGeometryChange.mock.calls.length).toBe(1);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(onGeometryChange.mock.calls.length).toBe(1);
  });
});

describe('useWindowCenterLayout - guards', () => {
  it('does nothing when disabled', () => {
    const { onGeometryChange } = renderCenter({ enabled: false });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does nothing once the window is user-sized', () => {
    const { onGeometryChange } = renderCenter({ userSized: true });
    expect(onGeometryChange).not.toHaveBeenCalled();
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

describe('useWindowCenterLayout - re-centers when user-sizing clears', () => {
  it('resumes reporting the centered frame when userSized goes back to false (reopen)', () => {
    const { onGeometryChange, rerender } = renderCenter({ userSized: true });
    expect(onGeometryChange).not.toHaveBeenCalled();
    rerender({ enabled: true, userSized: false, width: 600 });
    const geo = onGeometryChange.mock.calls.at(-1)![0];
    expect(geo.x).toBe(Math.round(Math.max(EDGE_MARGIN, (VW - 600) / 2)));
    expect(geo.y).toBe(Math.round(Math.max(EDGE_MARGIN, (VH - TASKBAR_HEIGHT - 400) / 2)));
  });
});
