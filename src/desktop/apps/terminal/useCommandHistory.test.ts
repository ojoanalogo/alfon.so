import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCommandHistory } from './useCommandHistory';

describe('useCommandHistory', () => {
  it('returns null from both navigate functions when history is empty', () => {
    const { result } = renderHook(() => useCommandHistory());
    expect(result.current.navigateUp()).toBeNull();
    expect(result.current.navigateDown()).toBeNull();
  });

  it('recalls the latest command first, then walks backwards', () => {
    const { result } = renderHook(() => useCommandHistory());
    act(() => {
      result.current.push('ls');
      result.current.push('cat about');
    });

    // Each navigate triggers a state update, so wrap each to flush the
    // re-render — mirroring real usage (one keypress per event/render).
    let recalled: string | null;
    act(() => {
      recalled = result.current.navigateUp();
    });
    expect(recalled!).toBe('cat about');
    act(() => {
      recalled = result.current.navigateUp();
    });
    expect(recalled!).toBe('ls');
    // At the oldest entry: stays there.
    act(() => {
      recalled = result.current.navigateUp();
    });
    expect(recalled!).toBe('ls');
  });

  it('walks back down and clears the draft past the newest entry', () => {
    const { result } = renderHook(() => useCommandHistory());
    act(() => {
      result.current.push('ls');
      result.current.push('help');
    });

    act(() => {
      result.current.navigateUp();
    });
    act(() => {
      result.current.navigateUp();
    });

    let recalled: string | null;
    act(() => {
      recalled = result.current.navigateDown();
    });
    expect(recalled!).toBe('help');
    act(() => {
      recalled = result.current.navigateDown();
    });
    expect(recalled!).toBe('');
    // Cursor reset: further down is a no-op.
    act(() => {
      recalled = result.current.navigateDown();
    });
    expect(recalled!).toBeNull();
  });

  it('resets the cursor on push so the next up recalls the new command', () => {
    const { result } = renderHook(() => useCommandHistory());
    act(() => result.current.push('first'));

    let recalled: string | null;
    act(() => {
      recalled = result.current.navigateUp();
    });
    expect(recalled!).toBe('first');

    act(() => result.current.push('second'));
    act(() => {
      recalled = result.current.navigateUp();
    });
    expect(recalled!).toBe('second');
  });
});
