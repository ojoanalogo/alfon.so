import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameControls } from './useGameControls';

function dispatchKeyDown(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useGameControls', () => {
  it('calls the handler on keydown while active', () => {
    const onKeyDown = vi.fn();
    renderHook(() => useGameControls(true, onKeyDown));

    dispatchKeyDown('ArrowUp');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowUp');
  });

  it('does not attach the handler while inactive', () => {
    const onKeyDown = vi.fn();
    renderHook(() => useGameControls(false, onKeyDown));

    dispatchKeyDown('ArrowUp');

    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('preventDefaults when the handler returns true', () => {
    const onKeyDown = vi.fn(() => true);
    renderHook(() => useGameControls(true, onKeyDown));

    const event = dispatchKeyDown('ArrowLeft');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not preventDefault when the handler returns false', () => {
    const onKeyDown = vi.fn(() => false);
    renderHook(() => useGameControls(true, onKeyDown));

    const event = dispatchKeyDown('ArrowLeft');

    expect(event.defaultPrevented).toBe(false);
  });

  it('does not preventDefault when the handler returns void/undefined', () => {
    const onKeyDown = vi.fn(() => undefined);
    renderHook(() => useGameControls(true, onKeyDown));

    const event = dispatchKeyDown('Space');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('detaches the handler when becoming inactive', () => {
    const onKeyDown = vi.fn();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useGameControls(active, onKeyDown),
      { initialProps: { active: true } },
    );

    dispatchKeyDown('a');
    expect(onKeyDown).toHaveBeenCalledTimes(1);

    rerender({ active: false });
    dispatchKeyDown('a');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('attaches the handler when becoming active', () => {
    const onKeyDown = vi.fn();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useGameControls(active, onKeyDown),
      { initialProps: { active: false } },
    );

    dispatchKeyDown('a');
    expect(onKeyDown).not.toHaveBeenCalled();

    rerender({ active: true });
    dispatchKeyDown('a');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('rebinds to the latest handler when it changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }: { handler: (e: KeyboardEvent) => boolean | void }) =>
        useGameControls(true, handler),
      { initialProps: { handler: first } },
    );

    dispatchKeyDown('d');
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ handler: second });
    dispatchKeyDown('d');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('removes the handler on unmount', () => {
    const onKeyDown = vi.fn();
    const { unmount } = renderHook(() => useGameControls(true, onKeyDown));

    dispatchKeyDown('ArrowDown');
    expect(onKeyDown).toHaveBeenCalledTimes(1);

    unmount();
    dispatchKeyDown('ArrowDown');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
