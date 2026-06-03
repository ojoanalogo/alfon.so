import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAxisControls } from './useAxisControls';

function dispatchKeyUp(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { key }));
}

describe('useAxisControls', () => {
  it('zeroes moveRef on keyup for an axis key while active', () => {
    const moveRef = { current: 1 };
    renderHook(() => useAxisControls(true, moveRef));

    dispatchKeyUp('ArrowLeft');
    expect(moveRef.current).toBe(0);
  });

  it('zeroes moveRef for each recognised axis key', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'a', 'd']) {
      const moveRef = { current: -1 };
      const { unmount } = renderHook(() => useAxisControls(true, moveRef));

      dispatchKeyUp(key);
      expect(moveRef.current).toBe(0);

      unmount();
    }
  });

  it('ignores keyup for non-axis keys', () => {
    const moveRef = { current: 1 };
    renderHook(() => useAxisControls(true, moveRef));

    dispatchKeyUp('ArrowUp');
    expect(moveRef.current).toBe(1);

    dispatchKeyUp('w');
    expect(moveRef.current).toBe(1);
  });

  it('zeroes moveRef immediately when inactive', () => {
    const moveRef = { current: 1 };
    renderHook(() => useAxisControls(false, moveRef));

    expect(moveRef.current).toBe(0);
  });

  it('does not listen for keyup while inactive', () => {
    const moveRef = { current: 0 };
    renderHook(() => useAxisControls(false, moveRef));

    // Simulate the game setting the ref after the inactive zero-out.
    moveRef.current = 1;
    dispatchKeyUp('ArrowLeft');
    expect(moveRef.current).toBe(1);
  });

  it('clears moveRef when transitioning from active to inactive', () => {
    const moveRef = { current: 0 };
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useAxisControls(active, moveRef),
      { initialProps: { active: true } },
    );

    moveRef.current = 1;
    rerender({ active: false });
    expect(moveRef.current).toBe(0);

    // Listener is gone, so subsequent keyup does not re-zero a fresh value.
    moveRef.current = 1;
    dispatchKeyUp('ArrowRight');
    expect(moveRef.current).toBe(1);
  });

  it('starts listening when transitioning from inactive to active', () => {
    const moveRef = { current: 0 };
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useAxisControls(active, moveRef),
      { initialProps: { active: false } },
    );

    rerender({ active: true });
    moveRef.current = 1;
    dispatchKeyUp('d');
    expect(moveRef.current).toBe(0);
  });

  it('removes the keyup listener on unmount', () => {
    const moveRef = { current: 0 };
    const { unmount } = renderHook(() => useAxisControls(true, moveRef));

    unmount();
    moveRef.current = 1;
    dispatchKeyUp('ArrowLeft');
    expect(moveRef.current).toBe(1);
  });
});
