import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { IconPosition } from '../../state/useDesktopIcons';
import { useDesktopIconDrag } from './useDesktopIconDrag';

type DragDeps = Parameters<typeof useDesktopIconDrag>[0];

function makeReactPointerEvent(
  overrides: Partial<{
    button: number;
    pointerId: number;
    clientX: number;
    clientY: number;
  }> = {},
) {
  return {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as ReactPointerEvent;
}

function dispatchPointer(
  type: 'pointermove' | 'pointerup' | 'pointercancel',
  init: { pointerId?: number; clientX?: number; clientY?: number } = {},
) {
  const event = new PointerEvent(type, {
    pointerId: init.pointerId ?? 1,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    bubbles: true,
  });
  // jsdom does not always copy clientX/clientY onto PointerEvent reliably.
  Object.defineProperty(event, 'clientX', { value: init.clientX ?? 0, configurable: true });
  Object.defineProperty(event, 'clientY', { value: init.clientY ?? 0, configurable: true });
  act(() => {
    window.dispatchEvent(event);
  });
}

/** A trash element with a fixed bounding box at (500..560, 500..560). */
function makeTrashEl(): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      left: 500,
      right: 560,
      top: 500,
      bottom: 560,
      width: 60,
      height: 60,
      x: 500,
      y: 500,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

function makeDeps(overrides: Partial<DragDeps> = {}): DragDeps {
  const positions: Record<string, IconPosition> = {
    a: { x: 10, y: 10 },
    b: { x: 100, y: 100 },
  };
  return {
    positions,
    selected: new Set<string>(['a']),
    selectOnly: vi.fn(),
    moveIcons: vi.fn(),
    deleteIcons: vi.fn(),
    trashRef: { current: makeTrashEl() },
    suppressTrashClickRef: { current: false },
    ...overrides,
  };
}

beforeEach(() => {
  document.body.className = '';
  vi.restoreAllMocks();
});

afterEach(() => {
  document.body.className = '';
  // matchMedia is assigned directly in one test; remove it so it does not leak.
  window.matchMedia = undefined as unknown as typeof window.matchMedia;
});

describe('useDesktopIconDrag', () => {
  it('returns visual, startDrag, and consumeSuppressedClick', () => {
    const { result } = renderHook(() => useDesktopIconDrag(makeDeps()));
    expect(typeof result.current.startDrag).toBe('function');
    expect(typeof result.current.consumeSuppressedClick).toBe('function');
    expect(result.current.visual).toEqual({
      tiltX: 0,
      tiltY: 0,
      ramp: 0,
      draggingIds: new Set(),
    });
  });

  it('does not start a drag for a non-primary button', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ button: 1 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    // A move past threshold should do nothing because no drag is active.
    dispatchPointer('pointermove', { clientX: 50, clientY: 50 });
    expect(deps.moveIcons).not.toHaveBeenCalled();
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
  });

  it('ignores startDrag with empty origins and calls preventDefault otherwise', () => {
    const { result } = renderHook(() => useDesktopIconDrag(makeDeps()));

    const empty = makeReactPointerEvent();
    act(() => {
      result.current.startDrag(empty, 'a', {});
    });
    expect(empty.preventDefault).not.toHaveBeenCalled();

    const ok = makeReactPointerEvent();
    act(() => {
      result.current.startDrag(ok, 'a', { a: { x: 10, y: 10 } });
    });
    expect(ok.preventDefault).toHaveBeenCalled();
    expect(ok.stopPropagation).toHaveBeenCalled();
  });

  it('does not move below the drag threshold', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    // hypot(1, 1) ≈ 1.41 < 2 threshold.
    dispatchPointer('pointermove', { clientX: 1, clientY: 1 });
    expect(deps.moveIcons).not.toHaveBeenCalled();
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
  });

  it('past threshold sets is-window-gesturing on body and calls moveIcons', () => {
    const deps = makeDeps();
    const origins = { a: { x: 10, y: 10 } };
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', origins);
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });

    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);
    expect(deps.moveIcons).toHaveBeenCalledTimes(1);
    expect(deps.moveIcons).toHaveBeenCalledWith(origins, 30, 40);
  });

  it('clears the body gesture classes if it unmounts mid-drag', () => {
    const deps = makeDeps();
    const { result, unmount } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);

    // No pointerup arrives before unmount; cleanup must not leave the class stuck.
    unmount();
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
    expect(document.body.classList.contains('is-trash-drop-target')).toBe(false);
  });

  it('ignores pointermove with a mismatched pointerId', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(
        makeReactPointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'a',
        { a: { x: 10, y: 10 } },
      );
    });
    dispatchPointer('pointermove', { pointerId: 999, clientX: 30, clientY: 40 });
    expect(deps.moveIcons).not.toHaveBeenCalled();
  });

  it('selects the icon when dragging an unselected icon and narrows origins to it', () => {
    const deps = makeDeps({ selected: new Set<string>(['b']) });
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    // origins passed in includes both, but 'a' is not selected → it gets narrowed.
    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
        b: { x: 100, y: 100 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 0 });

    expect(deps.selectOnly).toHaveBeenCalledWith('a');
    // moveIcons receives the narrowed origins ({ a: positions.a }).
    expect(deps.moveIcons).toHaveBeenCalledWith({ a: { x: 10, y: 10 } }, 30, 0);
  });

  it('toggles is-trash-drop-target when the pointer enters and leaves the trash', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    // Move over the trash box (530,530).
    dispatchPointer('pointermove', { clientX: 530, clientY: 530 });
    expect(document.body.classList.contains('is-trash-drop-target')).toBe(true);

    // Move away.
    dispatchPointer('pointermove', { clientX: 0, clientY: 0 });
    expect(document.body.classList.contains('is-trash-drop-target')).toBe(false);
  });

  it('pointerup over trash calls deleteIcons and sets the suppress flags', () => {
    const deps = makeDeps();
    const origins = { a: { x: 10, y: 10 } };
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', origins);
    });
    dispatchPointer('pointermove', { clientX: 530, clientY: 530 });
    dispatchPointer('pointerup', { clientX: 530, clientY: 530 });

    expect(deps.deleteIcons).toHaveBeenCalledWith(['a']);
    expect(deps.suppressTrashClickRef.current).toBe(true);
    // teardown clears body classes.
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
    expect(document.body.classList.contains('is-trash-drop-target')).toBe(false);
    // consumeSuppressedClick reflects the click suppression set on a moved drag.
    expect(result.current.consumeSuppressedClick()).toBe(true);
  });

  it('pointerup elsewhere does NOT delete and starts a release animation', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    dispatchPointer('pointerup', { clientX: 30, clientY: 40 });

    expect(deps.deleteIcons).not.toHaveBeenCalled();
    expect(deps.suppressTrashClickRef.current).toBe(false);
    // Release animation publishes a non-empty dragging set while ramping out.
    expect(result.current.visual.draggingIds.has('a')).toBe(true);
    // body classes already cleared by teardown.
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
  });

  it('pointerup without crossing the threshold just resets without suppressing the click', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    // No move at all → not moved.
    dispatchPointer('pointerup', { clientX: 0, clientY: 0 });

    expect(deps.deleteIcons).not.toHaveBeenCalled();
    expect(result.current.consumeSuppressedClick()).toBe(false);
    expect(result.current.visual.draggingIds.size).toBe(0);
  });

  it('ignores pointerup with a mismatched pointerId', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(
        makeReactPointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'a',
        { a: { x: 10, y: 10 } },
      );
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    dispatchPointer('pointerup', { pointerId: 999, clientX: 30, clientY: 40 });
    // Drag still active: body class remains, click not yet suppressed-consumed.
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);
  });

  it('pointercancel terminates the drag like pointerup', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    dispatchPointer('pointercancel', { clientX: 30, clientY: 40 });

    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
    expect(result.current.consumeSuppressedClick()).toBe(true);
  });

  it('consumeSuppressedClick returns false then true, and resets after a read', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    // No drag yet.
    expect(result.current.consumeSuppressedClick()).toBe(false);

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    dispatchPointer('pointerup', { clientX: 30, clientY: 40 });

    // First read returns + resets the flag.
    expect(result.current.consumeSuppressedClick()).toBe(true);
    expect(result.current.consumeSuppressedClick()).toBe(false);
  });

  it('teardown on unmount removes the gesturing body classes and listeners', () => {
    const deps = makeDeps();
    const { result, unmount } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);

    unmount();
    document.body.className = '';

    // After unmount the window listeners are gone: further moves are ignored.
    const before = vi.mocked(deps.moveIcons).mock.calls.length;
    dispatchPointer('pointermove', { clientX: 90, clientY: 90 });
    expect(vi.mocked(deps.moveIcons).mock.calls.length).toBe(before);
  });

  it('drives the release ramp to zero and clears draggingIds via rAF', async () => {
    // prefersReducedMotion() reads matchMedia, which jsdom does not provide.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const rafCbs: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCbs.push(cb);
      return rafCbs.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const deps = makeDeps();
    const { result } = renderHook(() => useDesktopIconDrag(deps));

    act(() => {
      result.current.startDrag(makeReactPointerEvent({ clientX: 0, clientY: 0 }), 'a', {
        a: { x: 10, y: 10 },
      });
    });
    dispatchPointer('pointermove', { clientX: 30, clientY: 40 });
    dispatchPointer('pointerup', { clientX: 30, clientY: 40 });

    expect(result.current.visual.draggingIds.has('a')).toBe(true);

    // Advance time well past ICON_DRAG_RAMP_OUT_MS (320) and flush rAF callbacks.
    now = 5000;
    act(() => {
      const cbs = rafCbs.splice(0);
      for (const cb of cbs) cb(now);
    });

    // Ramp reached 0 → dragging set cleared.
    expect(result.current.visual.ramp).toBe(0);
    expect(result.current.visual.draggingIds.size).toBe(0);
  });
});
