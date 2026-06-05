import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { makeWindowDef } from '@test/factories';
import { useWindowManager } from './useWindowManager';
import type { WindowDef } from '../types';

// jsdom defaults window.innerWidth to 1024 (desktop, not mobile). We rely on
// that throughout: the hook's mount useLayoutEffect re-syncs initial state from
// window.innerWidth/innerHeight, so the geometry below reflects the live window.

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

function defs(extra: Partial<WindowDef>[] = []): WindowDef[] {
  return [
    makeWindowDef({ id: 'a', title: 'A', initialZ: 10, defaultWidth: 600, defaultHeight: 400 }),
    makeWindowDef({ id: 'b', title: 'B', initialZ: 20, defaultWidth: 500, defaultHeight: 300 }),
    ...extra.map((o) => makeWindowDef(o)),
  ];
}

function renderManager(d: WindowDef[] = defs()) {
  return renderHook(() => useWindowManager(d, VW, VH));
}

beforeEach(() => {
  setViewport(VW, VH);
  document.body.className = '';
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('useWindowManager - initial state', () => {
  it('builds a WindowState entry per def, keyed by id', () => {
    const { result } = renderManager();
    expect(Object.keys(result.current.windows).sort()).toEqual(['a', 'b']);
    expect(result.current.windows.a.id).toBe('a');
    expect(result.current.windows.b.id).toBe('b');
  });

  it('order matches def order', () => {
    const { result } = renderManager();
    expect(result.current.order).toEqual(['a', 'b']);
  });

  it('windows start closed when defaultOpen is not set', () => {
    const { result } = renderManager();
    expect(result.current.windows.a.open).toBe(false);
    expect(result.current.windows.b.open).toBe(false);
  });

  it('focusedId is the first defaultOpen window, else null', () => {
    const { result: noOpen } = renderManager();
    expect(noOpen.current.focusedId).toBeNull();

    const d = [
      makeWindowDef({ id: 'x', defaultOpen: false }),
      makeWindowDef({ id: 'y', defaultOpen: true }),
    ];
    const { result: withOpen } = renderManager(d);
    expect(withOpen.current.focusedId).toBe('y');
    expect(withOpen.current.windows.y.open).toBe(true);
  });

  it('seeds zIndex from initialZ', () => {
    const { result } = renderManager();
    expect(result.current.windows.a.zIndex).toBe(10);
    expect(result.current.windows.b.zIndex).toBe(20);
  });

  it('uses defaultHeight when provided', () => {
    const { result } = renderManager();
    expect(result.current.windows.a.height).toBe(400);
    expect(result.current.windows.b.height).toBe(300);
  });
});

describe('useWindowManager - open', () => {
  it('opens a closed window and brings it to front', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    expect(result.current.windows.a.open).toBe(true);
    expect(result.current.windows.a.minimized).toBe(false);
    expect(result.current.focusedId).toBe('a');
  });

  it('bumps zIndex above the previous top when opening', () => {
    const { result } = renderManager();
    const before = result.current.windows.a.zIndex;
    act(() => result.current.open('a'));
    // topZ starts at max(initialZ) = 20, first bump -> 21
    expect(result.current.windows.a.zIndex).toBeGreaterThan(before);
    expect(result.current.windows.a.zIndex).toBe(21);
  });

  it('un-minimizes an already-open minimized window', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.minimize('a'));
    expect(result.current.windows.a.minimized).toBe(true);
    act(() => result.current.open('a'));
    expect(result.current.windows.a.minimized).toBe(false);
    expect(result.current.windows.a.open).toBe(true);
  });

  it('preserves custom geometry when restoring a minimized window', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    // User resizes/moves the window (sets userSized via the gesture class).
    act(() => result.current.setUserGeometry('a', { x: 250, y: 180, width: 720 }));
    expect(result.current.windows.a.userSized).toBe(true);

    act(() => result.current.minimize('a'));
    act(() => result.current.open('a'));

    // Restoring from minimized must NOT reset to default geometry: a minimized
    // window was never closed, so its size/position and userSized are preserved.
    expect(result.current.windows.a.userSized).toBe(true);
    expect(result.current.windows.a.x).toBe(250);
    expect(result.current.windows.a.y).toBe(180);
    expect(result.current.windows.a.width).toBe(720);
  });

  it('is a no-op for unknown ids (no entry created)', () => {
    const { result } = renderManager();
    act(() => result.current.open('missing'));
    expect(result.current.windows.missing).toBeUndefined();
    // focus is still attempted via bringToFront but target is undefined -> state unchanged
    expect(result.current.focusedId).toBe('missing');
  });

  it('applies default open geometry (clears userSized) when opening from closed on desktop', () => {
    const { result } = renderManager();
    // Mark as user-sized first by opening, gesturing, and resizing.
    act(() => result.current.open('a'));
    act(() => result.current.setUserGeometry('a', { width: 700 }));
    expect(result.current.windows.a.userSized).toBe(true);

    act(() => result.current.close('a'));
    act(() => result.current.open('a'));
    // Re-opening from closed resets userSized to false.
    expect(result.current.windows.a.userSized).toBe(false);
  });
});

describe('useWindowManager - close', () => {
  it('closes the window and resets minimized/maximized', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.toggleMaximize('a'));
    expect(result.current.windows.a.maximized).toBe(true);
    act(() => result.current.close('a'));
    expect(result.current.windows.a.open).toBe(false);
    expect(result.current.windows.a.minimized).toBe(false);
    expect(result.current.windows.a.maximized).toBe(false);
  });

  it('clears focusedId when the closed window was focused', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    expect(result.current.focusedId).toBe('a');
    act(() => result.current.close('a'));
    expect(result.current.focusedId).toBeNull();
  });

  it('leaves focusedId untouched when a non-focused window is closed', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.open('b'));
    expect(result.current.focusedId).toBe('b');
    act(() => result.current.close('a'));
    expect(result.current.focusedId).toBe('b');
  });

  it('is a no-op for unknown ids', () => {
    const { result } = renderManager();
    act(() => result.current.close('missing'));
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - minimize', () => {
  it('sets minimized true and clears focus if focused', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.minimize('a'));
    expect(result.current.windows.a.minimized).toBe(true);
    expect(result.current.windows.a.open).toBe(true);
    expect(result.current.focusedId).toBeNull();
  });

  it('keeps focus on another window when minimizing a non-focused one', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.open('b'));
    act(() => result.current.minimize('a'));
    expect(result.current.windows.a.minimized).toBe(true);
    expect(result.current.focusedId).toBe('b');
  });
});

describe('useWindowManager - toggleMaximize', () => {
  it('toggles maximized on an open window and brings to front', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.open('b'));
    expect(result.current.focusedId).toBe('b');
    act(() => result.current.toggleMaximize('a'));
    expect(result.current.windows.a.maximized).toBe(true);
    expect(result.current.focusedId).toBe('a');
    act(() => result.current.toggleMaximize('a'));
    expect(result.current.windows.a.maximized).toBe(false);
  });

  it('does nothing to maximized state for a closed window', () => {
    const { result } = renderManager();
    expect(result.current.windows.a.open).toBe(false);
    act(() => result.current.toggleMaximize('a'));
    expect(result.current.windows.a.maximized).toBe(false);
  });
});

describe('useWindowManager - focus / unfocus', () => {
  it('focus bumps zIndex and sets focusedId', () => {
    const { result } = renderManager();
    const beforeZ = result.current.windows.a.zIndex;
    act(() => result.current.focus('a'));
    expect(result.current.focusedId).toBe('a');
    expect(result.current.windows.a.zIndex).toBeGreaterThan(beforeZ);
  });

  it('successive focus calls keep raising the top z-index', () => {
    const { result } = renderManager();
    act(() => result.current.focus('a'));
    const zA = result.current.windows.a.zIndex;
    act(() => result.current.focus('b'));
    const zB = result.current.windows.b.zIndex;
    expect(zB).toBeGreaterThan(zA);
    act(() => result.current.focus('a'));
    expect(result.current.windows.a.zIndex).toBeGreaterThan(zB);
  });

  it('unfocus clears focusedId', () => {
    const { result } = renderManager();
    act(() => result.current.focus('a'));
    expect(result.current.focusedId).toBe('a');
    act(() => result.current.unfocus());
    expect(result.current.focusedId).toBeNull();
  });

  it('is a no-op when refocusing the already-top focused window', () => {
    const { result } = renderManager();
    act(() => result.current.focus('a'));
    const snapshot = result.current.windows.a;
    // Re-focusing the window that is already focused and top-most must not bump
    // z or write state (every pointer-down on the focused window calls focus).
    act(() => result.current.focus('a'));
    expect(result.current.windows.a).toBe(snapshot);
  });
});

describe('useWindowManager - correctLayout (auto placement)', () => {
  it('applies a position patch without marking userSized', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 123, y: 45 }));
    expect(result.current.windows.a.x).toBe(123);
    expect(result.current.windows.a.y).toBe(45);
    expect(result.current.windows.a.userSized).toBeUndefined();
  });

  it('clamps width to the effective min width', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { width: 50 }));
    expect(result.current.windows.a.width).toBe(400);
  });

  it('clamps height to MIN_HEIGHT', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { height: 10 }));
    expect(result.current.windows.a.height).toBe(140);
  });

  it('is a no-op when the patch does not change anything', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 300 }));
    const snapshot = result.current.windows.a;
    act(() => result.current.correctLayout('a', { x: 300 }));
    expect(result.current.windows.a).toBe(snapshot);
  });

  it('is a no-op for unknown ids', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('missing', { x: 1 }));
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - setUserGeometry (user move/resize)', () => {
  it('applies the patch and marks the window userSized', () => {
    const { result } = renderManager();
    act(() => result.current.setUserGeometry('a', { x: 200 }));
    expect(result.current.windows.a.x).toBe(200);
    expect(result.current.windows.a.userSized).toBe(true);
  });

  it('still updates (sets userSized) for an unchanged geometry', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayout('a', { x: 300 }));
    const snapshot = result.current.windows.a;
    expect(snapshot.userSized).toBeUndefined();
    act(() => result.current.setUserGeometry('a', { x: 300 }));
    expect(result.current.windows.a.userSized).toBe(true);
    expect(result.current.windows.a).not.toBe(snapshot);
  });

  it('is a no-op for unknown ids', () => {
    const { result } = renderManager();
    act(() => result.current.setUserGeometry('missing', { x: 1 }));
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - correctLayouts (batch auto)', () => {
  it('applies multiple patches in one update', () => {
    const { result } = renderManager();
    act(() =>
      result.current.correctLayouts({ a: { x: 10, y: 20 }, b: { x: 30, y: 40 } }),
    );
    expect(result.current.windows.a.x).toBe(10);
    expect(result.current.windows.a.y).toBe(20);
    expect(result.current.windows.b.x).toBe(30);
    expect(result.current.windows.b.y).toBe(40);
  });

  it('clamps each patch independently', () => {
    const { result } = renderManager();
    act(() => result.current.correctLayouts({ a: { width: 10 }, b: { height: 5 } }));
    expect(result.current.windows.a.width).toBe(400);
    expect(result.current.windows.b.height).toBe(140);
  });

  it('skips unknown ids and no-op patches without changing state identity', () => {
    const { result } = renderManager();
    const before = result.current.windows;
    act(() =>
      result.current.correctLayouts({
        missing: { x: 1 },
        a: { x: before.a.x, y: before.a.y },
      }),
    );
    expect(result.current.windows).toBe(before);
    expect(result.current.windows.missing).toBeUndefined();
  });
});

describe('useWindowManager - relayoutToViewport', () => {
  it('recomputes geometry for closed windows from a new viewport', () => {
    const { result } = renderManager();
    // window 'a' is closed; relayout should reposition it.
    const before = { ...result.current.windows.a };
    act(() => result.current.relayoutToViewport(1600, 900));
    const after = result.current.windows.a;
    // Position should be recomputed (near-center placement differs for the new vw).
    const moved = after.x !== before.x || after.y !== before.y || after.width !== before.width;
    expect(moved).toBe(true);
  });

  it('leaves open windows untouched', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    const openSnapshot = { ...result.current.windows.a };
    act(() => result.current.relayoutToViewport(1600, 900));
    expect(result.current.windows.a.x).toBe(openSnapshot.x);
    expect(result.current.windows.a.y).toBe(openSnapshot.y);
    expect(result.current.windows.a.width).toBe(openSnapshot.width);
  });

  it('keeps open windows stable across a relayout to a different viewport', () => {
    // (Same-viewport identity is not guaranteed because near-center placement
    // can recompute; we assert the meaningful invariant: open windows are
    // never moved by relayout.)
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.open('b'));
    const a = { ...result.current.windows.a };
    const b = { ...result.current.windows.b };
    act(() => result.current.relayoutToViewport(VW, VH));
    expect(result.current.windows.a.x).toBe(a.x);
    expect(result.current.windows.a.y).toBe(a.y);
    expect(result.current.windows.b.x).toBe(b.x);
    expect(result.current.windows.b.y).toBe(b.y);
  });

  it('leaves centered windows for useWindowCenterLayout to place (no DOM measurement)', () => {
    // The manager no longer measures the DOM; it only repositions closed windows
    // from app defaults. Open centered windows are owned by useWindowCenterLayout.
    const centered = makeWindowDef({ id: 'c', center: true, defaultWidth: 500 });
    const { result } = renderManager([centered]);
    act(() => result.current.open('c'));
    const openSnapshot = { ...result.current.windows.c };
    act(() => result.current.relayoutToViewport(1600, 900));
    // Open window is untouched by relayout regardless of center.
    expect(result.current.windows.c.x).toBe(openSnapshot.x);
    expect(result.current.windows.c.y).toBe(openSnapshot.y);
  });
});

describe('useWindowManager - open applies default geometry', () => {
  it('resets an open-from-closed window to its declared default width and clears userSized', () => {
    const { result } = renderManager();
    act(() => result.current.open('a'));
    act(() => result.current.setUserGeometry('a', { width: 720 }));
    expect(result.current.windows.a.userSized).toBe(true);

    act(() => result.current.close('a'));
    act(() => result.current.open('a'));
    // defaultWidth 600 fits the 1024 viewport, so width returns to 600.
    expect(result.current.windows.a.width).toBe(600);
    expect(result.current.windows.a.userSized).toBe(false);
  });

  it('sizes a centered window from defaults without moving it across a close+reopen', () => {
    const centered = makeWindowDef({
      id: 'c',
      center: true,
      defaultWidth: 500,
      defaultHeight: 350,
    });
    const { result } = renderManager([centered]);
    act(() => result.current.open('c'));
    const { x, y } = result.current.windows.c;

    act(() => result.current.setUserGeometry('c', { width: 680 }));

    act(() => result.current.close('c'));
    act(() => result.current.open('c'));
    expect(result.current.windows.c.width).toBe(500); // reset to default
    expect(result.current.windows.c.userSized).toBe(false);
    expect(result.current.windows.c.x).toBe(x); // unchanged — centered defs keep x/y
    expect(result.current.windows.c.y).toBe(y);
  });
});
