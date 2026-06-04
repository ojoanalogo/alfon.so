import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { KONAMI_SEQUENCE } from '../lib/konami';
import { useKonamiCode } from './useKonamiCode';

// renderHook auto-unmounts after each test, so the document keydown listener is
// always removed between cases — no manual teardown is needed.
function dispatch(keys: readonly string[]) {
  act(() => {
    for (const key of keys) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
  });
}

describe('useKonamiCode', () => {
  it('calls onUnlock exactly once after the full sequence', () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));
    dispatch(KONAMI_SEQUENCE);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnlock for a partial or wrong sequence', () => {
    const cb = vi.fn();
    renderHook(() => useKonamiCode(cb));
    dispatch(['ArrowUp', 'ArrowUp', 'ArrowDown', 'x']);
    expect(cb).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useKonamiCode(cb));
    unmount();
    dispatch(KONAMI_SEQUENCE);
    expect(cb).not.toHaveBeenCalled();
  });

  it('invokes the latest callback without re-subscribing when it changes', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const a = vi.fn();
    const b = vi.fn();
    const { rerender } = renderHook(({ cb }) => useKonamiCode(cb), { initialProps: { cb: a } });

    const keydownSubsBefore = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
    rerender({ cb: b });
    // Swapping the callback must not add a second keydown listener (latest-ref).
    const keydownSubsAfter = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
    expect(keydownSubsAfter).toBe(keydownSubsBefore);

    dispatch(KONAMI_SEQUENCE);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
  });
});
