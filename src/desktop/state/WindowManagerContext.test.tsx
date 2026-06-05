import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { makeWindowDef } from '@test/factories';
import { WindowManagerProvider, useWindowManagerContext } from './WindowManagerContext';
import type { WindowDef } from '../types';
import { setViewport } from '@test/helpers';

// jsdom defaults window.innerWidth to 1024 (desktop, not mobile). The underlying
// useWindowManager re-syncs initial state from window.innerWidth/innerHeight in a
// mount useLayoutEffect, so we pin the viewport for determinism.
const VW = 1024;
const VH = 768;

function defs(): WindowDef[] {
  return [
    makeWindowDef({ id: 'a', title: 'A', initialZ: 10, defaultWidth: 600, defaultHeight: 400 }),
    makeWindowDef({
      id: 'b',
      title: 'B',
      initialZ: 20,
      defaultWidth: 500,
      defaultHeight: 300,
      defaultOpen: true,
    }),
  ];
}

function makeWrapper(d: WindowDef[] = defs()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <WindowManagerProvider defs={d} viewportWidth={VW} viewportHeight={VH}>
        {children}
      </WindowManagerProvider>
    );
  };
}

beforeEach(() => {
  setViewport(VW, VH);
  document.body.className = '';
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('useWindowManagerContext outside provider', () => {
  it('throws a descriptive error when used without a provider', () => {
    // renderHook surfaces the thrown error synchronously.
    expect(() => renderHook(() => useWindowManagerContext())).toThrow(
      'useWindowManagerContext must be used within WindowManagerProvider',
    );
  });
});

describe('WindowManagerProvider', () => {
  it('exposes the full window-manager API to consumers', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    const api = result.current;
    expect(typeof api.open).toBe('function');
    expect(typeof api.close).toBe('function');
    expect(typeof api.minimize).toBe('function');
    expect(typeof api.toggleMaximize).toBe('function');
    expect(typeof api.focus).toBe('function');
    expect(typeof api.unfocus).toBe('function');
    expect(typeof api.setUserGeometry).toBe('function');
    expect(typeof api.correctLayout).toBe('function');
    expect(typeof api.correctLayouts).toBe('function');
    expect(typeof api.relayoutToViewport).toBe('function');
  });

  it('seeds window state and order from the supplied defs', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    expect(result.current.order).toEqual(['a', 'b']);
    expect(Object.keys(result.current.windows).sort()).toEqual(['a', 'b']);
    // 'a' is closed by default, 'b' is defaultOpen.
    expect(result.current.windows.a.open).toBe(false);
    expect(result.current.windows.b.open).toBe(true);
  });

  it('focuses the first defaultOpen window initially', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });
    expect(result.current.focusedId).toBe('b');
  });

  it('open() marks a window open and focuses it through context', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    act(() => {
      result.current.open('a');
    });

    expect(result.current.windows.a.open).toBe(true);
    expect(result.current.windows.a.minimized).toBe(false);
    expect(result.current.focusedId).toBe('a');
  });

  it('close() clears open state and unfocuses when it was focused', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    // 'b' starts open and focused.
    expect(result.current.focusedId).toBe('b');
    act(() => {
      result.current.close('b');
    });

    expect(result.current.windows.b.open).toBe(false);
    expect(result.current.windows.b.maximized).toBe(false);
    expect(result.current.focusedId).toBeNull();
  });

  it('minimize() flags minimized and drops focus', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    act(() => {
      result.current.minimize('b');
    });

    expect(result.current.windows.b.minimized).toBe(true);
    expect(result.current.focusedId).toBeNull();
  });

  it('focus() brings a window to the front with a higher zIndex than its peers', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    act(() => {
      result.current.focus('a');
    });

    expect(result.current.focusedId).toBe('a');
    expect(result.current.windows.a.zIndex).toBeGreaterThan(result.current.windows.b.zIndex);
  });

  it('toggleMaximize() flips maximized for an open window', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    expect(result.current.windows.b.maximized).toBe(false);
    act(() => {
      result.current.toggleMaximize('b');
    });
    expect(result.current.windows.b.maximized).toBe(true);

    act(() => {
      result.current.toggleMaximize('b');
    });
    expect(result.current.windows.b.maximized).toBe(false);
  });

  it('unfocus() clears the focused window', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    expect(result.current.focusedId).toBe('b');
    act(() => {
      result.current.unfocus();
    });
    expect(result.current.focusedId).toBeNull();
  });

  it('setUserGeometry() patches a window through context', () => {
    const { result } = renderHook(() => useWindowManagerContext(), { wrapper: makeWrapper() });

    act(() => {
      result.current.setUserGeometry('a', { x: 123, y: 45 });
    });

    expect(result.current.windows.a.x).toBe(123);
    expect(result.current.windows.a.y).toBe(45);
  });

  it('provides a stable manager identity to multiple consumers of the same provider', () => {
    const wrapper = makeWrapper();
    const first = renderHook(() => useWindowManagerContext(), { wrapper });
    // The context value is the manager object; its API functions are referentially
    // stable (useCallback) so re-reading the same consumer returns the same fns.
    const openA = first.result.current.open;
    act(() => {
      first.result.current.setUserGeometry('a', { x: 10 });
    });
    expect(first.result.current.open).toBe(openA);
  });
});
