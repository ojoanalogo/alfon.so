import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBrowserHistories } from './useBrowserHistories';

// normalizeBrowserUrl prepends https:// and the URL constructor adds a trailing
// slash for bare hosts, so 'example.com' -> 'https://example.com/'.
const norm = (host: string) => `https://${host}/`;

describe('useBrowserHistories', () => {
  it('get returns the EMPTY_STATE for an unknown appId', () => {
    const { result } = renderHook(() => useBrowserHistories());
    const state = result.current.get('nope');
    expect(state.url).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.index).toBe(-1);
    expect(state.reloadKey).toBe(0);
    expect(result.current.canBack('nope')).toBe(false);
    expect(result.current.canForward('nope')).toBe(false);
  });

  describe('hydrateInitial', () => {
    it('seeds the initial url, history and index', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.hydrateInitial('a', 'example.com'));
      const state = result.current.get('a');
      expect(state.url).toBe(norm('example.com'));
      expect(state.history).toEqual([norm('example.com')]);
      expect(state.index).toBe(0);
      expect(state.reloadKey).toBe(0);
    });

    it('is a no-op for a null initial url', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.hydrateInitial('a', null));
      expect(result.current.get('a').index).toBe(-1);
      expect(result.current.get('a').url).toBeNull();
    });

    it('is a no-op for an un-normalizable initial url', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.hydrateInitial('a', 'about:blank'));
      expect(result.current.get('a').history).toEqual([]);
    });

    it('only seeds once: a second hydrate does not overwrite existing state', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.hydrateInitial('a', 'first.com'));
      act(() => result.current.navigate('a', 'second.com'));
      // App is no longer empty, so hydrate must be ignored.
      act(() => result.current.hydrateInitial('a', 'third.com'));
      const state = result.current.get('a');
      expect(state.url).toBe(norm('second.com'));
      expect(state.history).toEqual([norm('first.com'), norm('second.com')]);
      expect(state.index).toBe(1);
    });
  });

  describe('navigate', () => {
    it('pushes onto history, advances index and returns the normalized url', () => {
      const { result } = renderHook(() => useBrowserHistories());
      let returned: string | null = null;
      act(() => {
        returned = result.current.navigate('a', 'example.com');
      });
      expect(returned).toBe(norm('example.com'));
      const state = result.current.get('a');
      expect(state.url).toBe(norm('example.com'));
      expect(state.history).toEqual([norm('example.com')]);
      expect(state.index).toBe(0);
    });

    it('returns null and does not mutate state for an invalid url', () => {
      const { result } = renderHook(() => useBrowserHistories());
      let returned: string | null = 'x';
      act(() => {
        returned = result.current.navigate('a', '   ');
      });
      expect(returned).toBeNull();
      expect(result.current.get('a').history).toEqual([]);
      expect(result.current.get('a').index).toBe(-1);
    });

    it('enables canBack after two navigations', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      expect(result.current.canBack('a')).toBe(false);
      expect(result.current.canForward('a')).toBe(false);
      act(() => result.current.navigate('a', 'two.com'));
      expect(result.current.canBack('a')).toBe(true);
      expect(result.current.canForward('a')).toBe(false);
      expect(result.current.get('a').index).toBe(1);
    });

    it('does not duplicate the current url when navigating to the same place', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'same.com'));
      act(() => result.current.navigate('a', 'same.com'));
      const state = result.current.get('a');
      expect(state.history).toEqual([norm('same.com')]);
      expect(state.index).toBe(0);
    });

    it('truncates forward history when navigating from a back-stack entry', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.navigate('a', 'two.com'));
      act(() => result.current.navigate('a', 'three.com'));
      act(() => result.current.back('a'));
      act(() => result.current.back('a'));
      expect(result.current.get('a').index).toBe(0);
      // Navigating now should drop two.com / three.com forward entries.
      act(() => result.current.navigate('a', 'four.com'));
      const state = result.current.get('a');
      expect(state.history).toEqual([norm('one.com'), norm('four.com')]);
      expect(state.index).toBe(1);
      expect(result.current.canForward('a')).toBe(false);
    });
  });

  describe('back / forward', () => {
    it('back moves the cursor and exposes canForward', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.navigate('a', 'two.com'));
      act(() => result.current.back('a'));
      const state = result.current.get('a');
      expect(state.index).toBe(0);
      expect(state.url).toBe(norm('one.com'));
      // history is preserved, only the cursor moved.
      expect(state.history).toEqual([norm('one.com'), norm('two.com')]);
      expect(result.current.canBack('a')).toBe(false);
      expect(result.current.canForward('a')).toBe(true);
    });

    it('back is a no-op at the start of history', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.back('a'));
      expect(result.current.get('a').index).toBe(0);
      expect(result.current.get('a').url).toBe(norm('one.com'));
    });

    it('back is a no-op for an unknown appId', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.back('ghost'));
      expect(result.current.get('ghost').index).toBe(-1);
    });

    it('forward moves the cursor back to the latest entry', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.navigate('a', 'two.com'));
      act(() => result.current.back('a'));
      act(() => result.current.forward('a'));
      const state = result.current.get('a');
      expect(state.index).toBe(1);
      expect(state.url).toBe(norm('two.com'));
      expect(result.current.canForward('a')).toBe(false);
      expect(result.current.canBack('a')).toBe(true);
    });

    it('forward is a no-op at the end of history', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.forward('a'));
      expect(result.current.get('a').index).toBe(0);
    });

    it('forward is a no-op for an unknown appId', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.forward('ghost'));
      expect(result.current.get('ghost').index).toBe(-1);
    });
  });

  describe('reload', () => {
    it('bumps reloadKey without touching history or index', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('a', 'one.com'));
      act(() => result.current.navigate('a', 'two.com'));
      const before = result.current.get('a');
      act(() => result.current.reload('a'));
      const after = result.current.get('a');
      expect(after.reloadKey).toBe(before.reloadKey + 1);
      expect(after.history).toEqual(before.history);
      expect(after.index).toBe(before.index);
      expect(after.url).toBe(before.url);
    });

    it('reload is a no-op for an unknown appId', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.reload('ghost'));
      expect(result.current.get('ghost').reloadKey).toBe(0);
    });
  });

  describe('independent stacks per appId', () => {
    it('keeps navigation state separate between appIds', () => {
      const { result } = renderHook(() => useBrowserHistories());
      act(() => result.current.navigate('twitter', 't1.com'));
      act(() => result.current.navigate('twitter', 't2.com'));
      act(() => result.current.navigate('browser', 'b1.com'));

      const twitter = result.current.get('twitter');
      const browser = result.current.get('browser');

      expect(twitter.history).toEqual([norm('t1.com'), norm('t2.com')]);
      expect(twitter.index).toBe(1);
      expect(browser.history).toEqual([norm('b1.com')]);
      expect(browser.index).toBe(0);

      // Moving back in one app must not affect the other.
      act(() => result.current.back('twitter'));
      expect(result.current.get('twitter').index).toBe(0);
      expect(result.current.get('browser').index).toBe(0);
      expect(result.current.canBack('twitter')).toBe(false);
      expect(result.current.canBack('browser')).toBe(false);

      // Reloading one app must not bump the other's reloadKey.
      act(() => result.current.reload('browser'));
      expect(result.current.get('browser').reloadKey).toBe(1);
      expect(result.current.get('twitter').reloadKey).toBe(0);
    });
  });
});
