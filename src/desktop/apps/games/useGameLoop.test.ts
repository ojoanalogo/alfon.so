import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameLoop } from './useGameLoop';

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks on the fixed interval while active', () => {
    const tick = vi.fn();
    renderHook(() => useGameLoop(true, tick, 100));

    expect(tick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('does not tick while inactive', () => {
    const tick = vi.fn();
    renderHook(() => useGameLoop(false, tick, 100));

    vi.advanceTimersByTime(1000);
    expect(tick).not.toHaveBeenCalled();
  });

  it('stops ticking after becoming inactive', () => {
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useGameLoop(active, tick, 100),
      { initialProps: { active: true } },
    );

    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(1);

    rerender({ active: false });
    vi.advanceTimersByTime(1000);
    // No further ticks after the interval is cleared.
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('starts ticking after becoming active', () => {
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useGameLoop(active, tick, 100),
      { initialProps: { active: false } },
    );

    vi.advanceTimersByTime(500);
    expect(tick).not.toHaveBeenCalled();

    rerender({ active: true });
    vi.advanceTimersByTime(200);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('clears the interval on unmount', () => {
    const tick = vi.fn();
    const { unmount } = renderHook(() => useGameLoop(true, tick, 100));

    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(1000);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('restarts the interval when intervalMs changes', () => {
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ intervalMs }: { intervalMs: number }) => useGameLoop(true, tick, intervalMs),
      { initialProps: { intervalMs: 100 } },
    );

    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(1);

    rerender({ intervalMs: 50 });
    vi.advanceTimersByTime(50);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('rebinds to the latest tick function when it changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ tick }: { tick: () => void }) => useGameLoop(true, tick, 100),
      { initialProps: { tick: first } },
    );

    vi.advanceTimersByTime(100);
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ tick: second });
    vi.advanceTimersByTime(100);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
