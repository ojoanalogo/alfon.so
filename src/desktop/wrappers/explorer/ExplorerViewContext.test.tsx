import { renderHook, act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { ExplorerViewProvider, useExplorerView } from './ExplorerViewContext';
import type { ExplorerViewMode } from './types';

function makeWrapper(defaultMode?: ExplorerViewMode) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ExplorerViewProvider defaultMode={defaultMode}>{children}</ExplorerViewProvider>;
  };
}

describe('ExplorerViewProvider / useExplorerView', () => {
  it('defaults to grid mode when no defaultMode is provided', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper() });
    expect(result.current.mode).toBe('grid');
    expect(typeof result.current.setMode).toBe('function');
  });

  it('honors an explicit defaultMode of "list"', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper('list') });
    expect(result.current.mode).toBe('list');
  });

  it('honors an explicit defaultMode of "grid"', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper('grid') });
    expect(result.current.mode).toBe('grid');
  });

  it('setMode toggles from grid to list', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper('grid') });
    expect(result.current.mode).toBe('grid');

    act(() => {
      result.current.setMode('list');
    });

    expect(result.current.mode).toBe('list');
  });

  it('setMode toggles from list back to grid', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper('list') });
    expect(result.current.mode).toBe('list');

    act(() => {
      result.current.setMode('grid');
    });

    expect(result.current.mode).toBe('grid');
  });

  it('supports repeated mode switches and stays in sync', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper() });

    act(() => result.current.setMode('list'));
    expect(result.current.mode).toBe('list');

    act(() => result.current.setMode('grid'));
    expect(result.current.mode).toBe('grid');

    act(() => result.current.setMode('list'));
    expect(result.current.mode).toBe('list');
  });

  it('keeps the context value referentially stable when mode is unchanged', () => {
    const { result, rerender } = renderHook(() => useExplorerView(), { wrapper: makeWrapper() });
    const first = result.current;

    rerender();

    // useMemo keyed on `mode` should return the same object across re-renders.
    expect(result.current).toBe(first);
  });

  it('produces a new context value object when mode changes', () => {
    const { result } = renderHook(() => useExplorerView(), { wrapper: makeWrapper() });
    const first = result.current;

    act(() => result.current.setMode('list'));

    expect(result.current).not.toBe(first);
    expect(result.current.mode).toBe('list');
  });

  it('throws when used outside of a provider', () => {
    expect(() => renderHook(() => useExplorerView())).toThrow(
      'useExplorerView must be used within ExplorerViewProvider',
    );
  });

  it('renders children inside the provider', () => {
    const { getByText } = render(
      <ExplorerViewProvider>
        <span>child-content</span>
      </ExplorerViewProvider>,
    );
    expect(getByText('child-content')).toBeTruthy();
  });

  it('isolates state between separate provider instances', () => {
    const a = renderHook(() => useExplorerView(), { wrapper: makeWrapper('grid') });
    const b = renderHook(() => useExplorerView(), { wrapper: makeWrapper('list') });

    act(() => a.result.current.setMode('list'));

    expect(a.result.current.mode).toBe('list');
    // Mutating provider A must not bleed into provider B.
    expect(b.result.current.mode).toBe('list');

    act(() => b.result.current.setMode('grid'));
    expect(b.result.current.mode).toBe('grid');
    expect(a.result.current.mode).toBe('list');
  });
});
