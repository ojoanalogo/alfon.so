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
});
