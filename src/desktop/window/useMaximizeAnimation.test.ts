import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMaximizeAnimation } from './useMaximizeAnimation';

afterEach(() => {
  vi.useRealTimers();
});

describe('useMaximizeAnimation', () => {
  it('initializes displayMaximized to the maximized prop with no transition', () => {
    const { result } = renderHook(() => useMaximizeAnimation(true, false));
    expect(result.current.displayMaximized).toBe(true);
    expect(result.current.maximizeTransition).toBe(false);
  });

  it('snaps displayMaximized synchronously when animation is disabled', () => {
    const { result, rerender } = renderHook(({ max, can }) => useMaximizeAnimation(max, can), {
      initialProps: { max: false, can: false },
    });
    expect(result.current.displayMaximized).toBe(false);
    rerender({ max: true, can: false });
    expect(result.current.displayMaximized).toBe(true);
    expect(result.current.maximizeTransition).toBe(false);
  });

  it('defers the display flip to a frame and ends the transition after ~360ms', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ max, can }) => useMaximizeAnimation(max, can), {
      initialProps: { max: false, can: true },
    });
    act(() => rerender({ max: true, can: true }));

    // The flip lands on the next animation frame.
    act(() => vi.advanceTimersByTime(20));
    expect(result.current.displayMaximized).toBe(true);
    expect(result.current.maximizeTransition).toBe(true);

    // The transition class clears after the ~360ms window.
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.maximizeTransition).toBe(false);
  });

  it('clears the stale transition timer when maximized flips again mid-animation', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ max }) => useMaximizeAnimation(max, true), {
      initialProps: { max: false },
    });

    act(() => rerender({ max: true }));
    act(() => vi.advanceTimersByTime(20)); // frame fires → transition begins
    expect(result.current.maximizeTransition).toBe(true);

    // Flip back before the first 360ms timer fires (t ≈ 120ms).
    act(() => vi.advanceTimersByTime(100));
    act(() => rerender({ max: false }));
    act(() => vi.advanceTimersByTime(20)); // frame fires → second transition begins
    expect(result.current.displayMaximized).toBe(false);
    expect(result.current.maximizeTransition).toBe(true);

    // Past the FIRST timer's original deadline: if it weren't cleared, it would
    // have ended the transition here. It must still be running (second animation).
    act(() => vi.advanceTimersByTime(250));
    expect(result.current.maximizeTransition).toBe(true);

    // The second animation's own 360ms window then completes.
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.maximizeTransition).toBe(false);
  });

  it('cancels the pending frame and timer on unmount', () => {
    vi.useFakeTimers();
    const cancelFrame = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const clearTimer = vi.spyOn(window, 'clearTimeout');
    const { rerender, unmount } = renderHook(({ max }) => useMaximizeAnimation(max, true), {
      initialProps: { max: false },
    });

    act(() => rerender({ max: true })); // schedules a frame + a 360ms timer
    cancelFrame.mockClear();
    clearTimer.mockClear();
    unmount();

    expect(cancelFrame).toHaveBeenCalled();
    expect(clearTimer).toHaveBeenCalled();
    cancelFrame.mockRestore();
    clearTimer.mockRestore();
  });
});
