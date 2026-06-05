import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewportSize } from './useViewportSize';
import { setViewport } from '@test/helpers';

describe('useViewportSize', () => {
  // jsdom default innerWidth is 1024; capture originals to restore.
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  beforeEach(() => {
    vi.useFakeTimers();
    setViewport(1024, 768);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    setViewport(originalWidth, originalHeight);
  });

  it('returns the current window dimensions after mount (useLayoutEffect applies real size)', () => {
    const { result } = renderHook(() => useViewportSize());
    // The hook's layout effect calls apply() synchronously on mount, so the
    // returned value reflects the real window — not the SSR fallback (390x844).
    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it('updates on a window resize event (coalesced through requestAnimationFrame)', () => {
    const { result } = renderHook(() => useViewportSize());
    expect(result.current).toEqual({ width: 1024, height: 768 });

    act(() => {
      setViewport(800, 600);
      window.dispatchEvent(new Event('resize'));
    });

    // The resize listener only *schedules* a rAF; the state has not updated yet.
    expect(result.current).toEqual({ width: 1024, height: 768 });

    // Flush the scheduled animation frame.
    act(() => {
      vi.advanceTimersByTime(32);
    });

    expect(result.current).toEqual({ width: 800, height: 600 });
  });

  it('coalesces a burst of resize events into a single update per frame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { result } = renderHook(() => useViewportSize());
    rafSpy.mockClear();

    act(() => {
      setViewport(900, 700);
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });

    // Three events in the same frame should only schedule one rAF.
    expect(rafSpy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(32);
    });

    expect(result.current).toEqual({ width: 900, height: 700 });
    rafSpy.mockRestore();
  });

  it('preserves the previous object reference when dimensions are unchanged', () => {
    const { result } = renderHook(() => useViewportSize());
    const first = result.current;

    act(() => {
      // Same dimensions; dispatch resize anyway.
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(32);
    });

    // setSize returns prev when width/height match, so identity is stable.
    expect(result.current).toBe(first);
  });

  it('responds to a fresh schedule after a frame has already flushed', () => {
    const { result } = renderHook(() => useViewportSize());

    act(() => {
      setViewport(640, 480);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(32);
    });
    expect(result.current).toEqual({ width: 640, height: 480 });

    // After raf was reset to 0, a second resize must schedule a new frame.
    act(() => {
      setViewport(1280, 1024);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(32);
    });
    expect(result.current).toEqual({ width: 1280, height: 1024 });
  });

  it('subscribes to visualViewport resize events when available', () => {
    // jsdom may or may not provide visualViewport; install a stub if missing.
    const hadVisualViewport = 'visualViewport' in window && window.visualViewport != null;
    const listeners = new Map<string, EventListenerOrEventListenerObject>();
    const stub = {
      addEventListener: vi.fn((type: string, cb: EventListenerOrEventListenerObject) => {
        listeners.set(type, cb);
      }),
      removeEventListener: vi.fn((type: string) => {
        listeners.delete(type);
      }),
    };

    if (!hadVisualViewport) {
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        value: stub,
      });
    }

    try {
      const { result, unmount } = renderHook(() => useViewportSize());

      // Whatever object is on window.visualViewport must have been subscribed.
      const vv = window.visualViewport as unknown as {
        addEventListener: ReturnType<typeof vi.fn>;
        removeEventListener?: ReturnType<typeof vi.fn>;
      };
      expect(vv.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

      act(() => {
        setViewport(500, 900);
        // Drive the visualViewport resize path specifically.
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
        // Fall back to the captured listener for the stub case.
        const cb = listeners.get('resize');
        if (cb) (cb as EventListener)(new Event('resize'));
        vi.advanceTimersByTime(32);
      });

      expect(result.current).toEqual({ width: 500, height: 900 });

      unmount();
    } finally {
      if (!hadVisualViewport) {
        Object.defineProperty(window, 'visualViewport', {
          configurable: true,
          value: undefined,
        });
      }
    }
  });

  it('removes listeners and cancels a pending frame on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useViewportSize());

    // Schedule a frame that is still pending at unmount time.
    act(() => {
      setViewport(700, 700);
      window.dispatchEvent(new Event('resize'));
    });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    // A pending raf (id !== 0) should be cancelled by the cleanup.
    expect(cancelSpy).toHaveBeenCalled();

    removeSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});
