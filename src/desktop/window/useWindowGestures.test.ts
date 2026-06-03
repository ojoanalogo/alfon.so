import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowGestures } from './useWindowGestures';
import { MIN_HEIGHT, TASKBAR_HEIGHT } from '../lib/layoutConstants';
import { makeWindowState } from '@test/factories';
import type { WindowState } from '../types';

const MIN_WIDTH = 400;

// jsdom defaults (verified): innerWidth=1024, innerHeight=768
const MAX_X = window.innerWidth - 48; // 976
const MAX_Y = window.innerHeight - TASKBAR_HEIGHT - 8; // 720

/**
 * Build a fake React.PointerEvent-like object. The hook only reads
 * button, pointerId, clientX, clientY and calls preventDefault/stopPropagation.
 */
function fakePointerEvent(
  overrides: {
    button?: number;
    pointerId?: number;
    clientX?: number;
    clientY?: number;
  } = {},
) {
  return {
    button: overrides.button ?? 0,
    pointerId: overrides.pointerId ?? 1,
    clientX: overrides.clientX ?? 0,
    clientY: overrides.clientY ?? 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/** Dispatch a real window pointermove so the hook's listener fires. */
function dispatchMove(pointerId: number, clientX: number, clientY: number) {
  const evt = new Event('pointermove') as PointerEvent;
  Object.assign(evt, { pointerId, clientX, clientY });
  act(() => {
    window.dispatchEvent(evt);
  });
}

function dispatchUp(type: 'pointerup' | 'pointercancel', pointerId: number) {
  const evt = new Event(type) as PointerEvent;
  Object.assign(evt, { pointerId });
  act(() => {
    window.dispatchEvent(evt);
  });
}

interface SetupOptions {
  state?: Partial<WindowState>;
  minWidth?: number;
  rectHeight?: number;
  rectWidth?: number;
}

function setup(options: SetupOptions = {}) {
  const onFocus = vi.fn();
  const onGeometryChange = vi.fn();
  const state = makeWindowState(options.state);

  // A fake root element used for measuredHeight/measuredWidth.
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      width: options.rectWidth ?? 0,
      height: options.rectHeight ?? 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

  const rootRef = { current: el } as React.RefObject<HTMLElement | null>;

  const hook = renderHook(() =>
    useWindowGestures({
      state,
      minWidth: options.minWidth ?? MIN_WIDTH,
      rootRef,
      onFocus,
      onGeometryChange,
    }),
  );

  return { hook, onFocus, onGeometryChange, rootRef };
}

beforeEach(() => {
  document.body.classList.remove('is-window-gesturing');
});

describe('useWindowGestures - startMove gating', () => {
  it('does nothing for non-left button', () => {
    const { hook, onFocus } = setup();
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ button: 2 }));
    });
    expect(onFocus).not.toHaveBeenCalled();
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
  });

  it('does nothing when window is maximized', () => {
    const { hook, onFocus } = setup({ state: { maximized: true } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent());
    });
    expect(onFocus).not.toHaveBeenCalled();
  });

  it('focuses, marks the body, and prevents default on a valid move start', () => {
    const { hook, onFocus } = setup();
    const evt = fakePointerEvent();
    act(() => {
      hook.result.current.startMove(evt);
    });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);
    expect(evt.preventDefault).toHaveBeenCalled();
  });
});

describe('useWindowGestures - move drag geometry', () => {
  it('translates a drag delta into x/y geometry', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 100, width: 600 },
    });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 7, clientX: 50, clientY: 50 }));
    });
    dispatchMove(7, 90, 130); // dx=40, dy=80
    expect(onGeometryChange).toHaveBeenLastCalledWith({ x: 140, y: 180 });
  });

  it('ignores pointermove from a different pointerId', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 10, y: 10 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 3, clientX: 0, clientY: 0 }));
    });
    dispatchMove(99, 100, 100); // wrong pointer
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('clamps x to the right edge (maxX = innerWidth - 48)', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 0, y: 0 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchMove(1, 5000, 0); // huge dx
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.x).toBe(MAX_X);
  });

  it('clamps x to the left so part of the window stays on-screen (min = -width + 96)', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 0, y: 0, width: 600 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchMove(1, -5000, 0); // huge negative dx
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.x).toBe(-600 + 96); // -504
  });

  it('clamps y at the top to 0', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 50, y: 50 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchMove(1, 0, -5000);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.y).toBe(0);
  });

  it('clamps y at the bottom to innerHeight - TASKBAR_HEIGHT - 8', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 50, y: 50 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchMove(1, 0, 5000);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.y).toBe(MAX_Y);
  });

  it('does not emit height during a move', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 0, y: 0 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchMove(1, 10, 10);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect('height' in last).toBe(false);
  });
});

describe('useWindowGestures - pointerup / pointercancel end the gesture', () => {
  it('stops emitting after pointerup and clears the body class', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 0, y: 0 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);
    dispatchUp('pointerup', 1);
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);

    onGeometryChange.mockClear();
    dispatchMove(1, 100, 100);
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('ignores pointerup from a different pointerId (gesture stays active)', () => {
    const { hook, onGeometryChange } = setup({ state: { x: 0, y: 0 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }));
    });
    dispatchUp('pointerup', 42); // wrong pointer
    expect(document.body.classList.contains('is-window-gesturing')).toBe(true);
    dispatchMove(1, 10, 10);
    expect(onGeometryChange).toHaveBeenCalled();
  });

  it('pointercancel also ends the gesture', () => {
    const { hook } = setup({ state: { x: 0, y: 0 } });
    act(() => {
      hook.result.current.startMove(fakePointerEvent({ pointerId: 5, clientX: 0, clientY: 0 }));
    });
    dispatchUp('pointercancel', 5);
    expect(document.body.classList.contains('is-window-gesturing')).toBe(false);
  });
});

describe('useWindowGestures - startResize gating', () => {
  it('does nothing for non-left button', () => {
    const { hook, onFocus } = setup();
    act(() => {
      hook.result.current.startResize(fakePointerEvent({ button: 1 }), 'e');
    });
    expect(onFocus).not.toHaveBeenCalled();
  });

  it('does nothing when maximized', () => {
    const { hook, onFocus } = setup({ state: { maximized: true } });
    act(() => {
      hook.result.current.startResize(fakePointerEvent(), 'se');
    });
    expect(onFocus).not.toHaveBeenCalled();
  });

  it('focuses and stops propagation on a valid resize start', () => {
    const { hook, onFocus } = setup();
    const evt = fakePointerEvent();
    act(() => {
      hook.result.current.startResize(evt, 'e');
    });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(evt.preventDefault).toHaveBeenCalled();
  });
});

describe('useWindowGestures - resize math per direction', () => {
  it('east: grows width by dx, leaves x unchanged', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 50, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'e',
      );
    });
    dispatchMove(1, 120, 0); // dx=120
    expect(onGeometryChange).toHaveBeenLastCalledWith({
      x: 100,
      y: 50,
      width: 720,
      height: 400,
    });
  });

  it('east: clamps width to minWidth', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: 400 },
      minWidth: 400,
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'e',
      );
    });
    dispatchMove(1, -5000, 0); // shrink way past min
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.width).toBe(400);
  });

  it('west: shrinking width moves x to keep the right edge anchored', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 0, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'w',
      );
    });
    dispatchMove(1, 50, 0); // dx=50 -> proposed width 550
    // x = origin.x + (origin.width - proposed) = 100 + (600 - 550) = 150
    expect(onGeometryChange).toHaveBeenLastCalledWith({
      x: 150,
      y: 0,
      width: 550,
      height: 400,
    });
  });

  it('west: clamps to minWidth and pins x at right edge', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 0, width: 600, height: 400 },
      minWidth: 400,
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'w',
      );
    });
    dispatchMove(1, 5000, 0); // huge positive dx -> proposed clamps to 400
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.width).toBe(400);
    // x = 100 + (600 - 400) = 300
    expect(last.x).toBe(300);
  });

  it('south: grows height by dy from startHeight', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, 90); // dy=90 -> 490
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(490);
    expect(last.y).toBe(0);
  });

  it('south: clamps height to MIN_HEIGHT', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, -5000);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(MIN_HEIGHT);
  });

  it('north: shrinking height moves y to keep the bottom edge anchored', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 200, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'n',
      );
    });
    dispatchMove(1, 0, 60); // dy=60 -> proposed height = 400 - 60 = 340
    // y = origin.y + (startHeight - proposed) = 200 + (400 - 340) = 260
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(340);
    expect(last.y).toBe(260);
  });

  it('north: clamps to MIN_HEIGHT and pins y at bottom edge', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 100, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'n',
      );
    });
    dispatchMove(1, 0, 5000); // huge dy -> proposed clamps to MIN_HEIGHT
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(MIN_HEIGHT);
    // y = 100 + (400 - 140) = 360
    expect(last.y).toBe(360);
  });

  it('north: pins the top at y=0 when dragged above the viewport, extending height to the bottom', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 100, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'n',
      );
    });
    // bottom = 100 + 400 = 500. dy=-300 -> proposed 700 would put top at -200.
    dispatchMove(1, 0, -300);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.y).toBe(0); // titlebar stays grabbable at the top
    expect(last.height).toBe(500); // height grows only to the bottom edge, no further
  });

  it('northwest: clamps the top to 0 while still resizing width from the west', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 200, y: 80, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'nw',
      );
    });
    // bottom = 80 + 400 = 480. dy=-200 -> top would be -120 -> clamped to 0, height 480.
    // west: dx=40 -> proposed width = 560, x = 200 + (600 - 560) = 240.
    dispatchMove(1, 40, -200);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.y).toBe(0);
    expect(last.height).toBe(480);
    expect(last.width).toBe(560);
    expect(last.x).toBe(240);
  });

  it('southeast: combines east width growth and south height growth', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'se',
      );
    });
    dispatchMove(1, 30, 40);
    expect(onGeometryChange).toHaveBeenLastCalledWith({
      x: 0,
      y: 0,
      width: 630,
      height: 440,
    });
  });

  it('northwest: combines west and north handling', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 200, width: 600, height: 400 },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'nw',
      );
    });
    dispatchMove(1, 50, 60);
    // w: proposed width = 550, x = 100 + (600-550) = 150
    // n: proposed height = 340, y = 200 + (400-340) = 260
    expect(onGeometryChange).toHaveBeenLastCalledWith({
      x: 150,
      y: 260,
      width: 550,
      height: 340,
    });
  });
});

describe('useWindowGestures - content-sized height (origin.height == null)', () => {
  it('east resize on a content-sized window omits height from the patch', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: null },
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'e',
      );
    });
    dispatchMove(1, 40, 0);
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect('height' in last).toBe(false);
    expect(last.width).toBe(640);
  });

  it('south resize on a content-sized window DOES emit height (affectsHeight)', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: null },
      rectHeight: 300, // measuredHeight falls back to the laid-out box
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, 50); // startHeight=300 -> 350
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(350);
  });
});

describe('useWindowGestures - measured dimensions feed the gesture origin', () => {
  it('south resize uses the measured rect height when state.height is null', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: null },
      rectHeight: 250,
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, 100); // 250 + 100
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(350);
  });

  it('falls back to MIN_HEIGHT when content-sized and the ref is detached', () => {
    const onFocus = vi.fn();
    const onGeometryChange = vi.fn();
    const state = makeWindowState({ x: 0, y: 0, width: 600, height: null });
    // No element behind the ref: measuredHeight()/measuredWidth() take the
    // `?? MIN_HEIGHT` / `?? state.width` fallbacks.
    const rootRef = { current: null } as React.RefObject<HTMLElement | null>;
    const hook = renderHook(() =>
      useWindowGestures({
        state,
        minWidth: MIN_WIDTH,
        rootRef,
        onFocus,
        onGeometryChange,
      }),
    );
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, 50); // startHeight = MIN_HEIGHT (140) -> 190
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(MIN_HEIGHT + 50);
  });

  it('a zero-sized rect yields startHeight 0, so south clamps to MIN_HEIGHT', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 0, y: 0, width: 600, height: null },
      rectHeight: 0,
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        's',
      );
    });
    dispatchMove(1, 0, 50); // startHeight = 0 -> max(140, 50) = 140
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.height).toBe(MIN_HEIGHT);
  });

  it('west resize uses the rounded measured width when the rect is wider', () => {
    const { hook, onGeometryChange } = setup({
      state: { x: 100, y: 0, width: 600, height: 400 },
      rectWidth: 642.6, // rounds to 643
    });
    act(() => {
      hook.result.current.startResize(
        fakePointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }),
        'w',
      );
    });
    dispatchMove(1, 0, 0); // dx=0 -> proposed = origin.width = 643, x unchanged
    const last = onGeometryChange.mock.calls.at(-1)![0];
    expect(last.width).toBe(643);
    expect(last.x).toBe(100);
  });
});
