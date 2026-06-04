import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppContext } from './useAppContext';
import { BROWSER_APP_ID, postWindowId } from '../lib/appIds';
import { makeBlogPost } from '@test/factories';
import type { BlogPostSummary } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';

/** Build the params object the hook requires, with vi.fn() stubs by default. */
function makeParams(overrides: Partial<Parameters<typeof useAppContext>[0]> = {}) {
  const browsers = {
    get: vi.fn(() => ({ url: null }) as never),
    navigate: vi.fn((_id: string, url: string) => url),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    canBack: vi.fn(() => false),
    canForward: vi.fn(() => false),
    hydrateInitial: vi.fn(),
  };
  const trash = {
    items: [],
    onOpenFile: vi.fn(),
    onRestore: vi.fn(),
    onRestoreAll: vi.fn(),
    onEmpty: vi.fn(),
  };
  const posts: BlogPostSummary[] = [];
  const desktopIconUrls: DesktopIconUrls = {};
  return {
    posts,
    openWindow: vi.fn(),
    browsers,
    trash,
    desktopIconUrls,
    setGeometry: vi.fn(),
    ...overrides,
  };
}

describe('useAppContext', () => {
  it('wires the returned object straight through from params', () => {
    const posts = [makeBlogPost({ slug: 'a' })];
    const params = makeParams({ posts });
    const { result } = renderHook(() => useAppContext(params));

    expect(result.current.posts).toBe(posts);
    expect(result.current.browsers).toBe(params.browsers);
    expect(result.current.trash).toBe(params.trash);
    expect(result.current.iconUrls).toBe(params.desktopIconUrls);
  });

  it('exposes iconUrls from the desktopIconUrls param', () => {
    const desktopIconUrls: DesktopIconUrls = {
      blog: '/blog.png',
      notes: '/notes.png',
    } as DesktopIconUrls;
    const params = makeParams({ desktopIconUrls });
    const { result } = renderHook(() => useAppContext(params));

    expect(result.current.iconUrls).toEqual({ blog: '/blog.png', notes: '/notes.png' });
  });

  it('onOpenApp is the openWindow callback verbatim', () => {
    const openWindow = vi.fn();
    const params = makeParams({ openWindow });
    const { result } = renderHook(() => useAppContext(params));

    expect(result.current.onOpenApp).toBe(openWindow);

    act(() => result.current.onOpenApp('terminal'));
    expect(openWindow).toHaveBeenCalledWith('terminal');
  });

  it('onOpenPost opens the window keyed by the post slug', () => {
    const openWindow = vi.fn();
    const params = makeParams({ openWindow });
    const { result } = renderHook(() => useAppContext(params));

    act(() => result.current.onOpenPost('my-slug'));
    expect(openWindow).toHaveBeenCalledWith(postWindowId('my-slug'));
    expect(openWindow).toHaveBeenCalledTimes(1);
  });

  it('onOpenLink navigates the browser, sets geometry, and opens the browser window', () => {
    const openWindow = vi.fn();
    const setGeometry = vi.fn();
    const navigate = vi.fn((_id: string, url: string) => url);
    const params = makeParams({
      openWindow,
      setGeometry,
      browsers: { ...makeParams().browsers, navigate },
    });
    const { result } = renderHook(() => useAppContext(params));

    act(() => result.current.onOpenLink('https://example.com'));

    expect(navigate).toHaveBeenCalledWith(BROWSER_APP_ID, 'https://example.com');
    expect(setGeometry).toHaveBeenCalledWith(BROWSER_APP_ID, { height: 520 });
    expect(openWindow).toHaveBeenCalledWith(BROWSER_APP_ID);
  });

  it('onOpenLink bails out (no geometry / no open) when navigate returns falsy', () => {
    const openWindow = vi.fn();
    const setGeometry = vi.fn();
    const navigate = vi.fn(() => null);
    const params = makeParams({
      openWindow,
      setGeometry,
      browsers: { ...makeParams().browsers, navigate },
    });
    const { result } = renderHook(() => useAppContext(params));

    act(() => result.current.onOpenLink('not-a-url'));

    expect(navigate).toHaveBeenCalledWith(BROWSER_APP_ID, 'not-a-url');
    expect(setGeometry).not.toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('memoizes the context across rerenders with stable inputs', () => {
    const params = makeParams();
    const { result, rerender } = renderHook(() => useAppContext(params));
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });

  it('recomputes the context when posts change', () => {
    const postsA = [makeBlogPost({ slug: 'a' })];
    const postsB = [makeBlogPost({ slug: 'b' })];
    const base = makeParams();

    const { result, rerender } = renderHook(({ posts }) => useAppContext({ ...base, posts }), {
      initialProps: { posts: postsA },
    });
    const first = result.current;

    rerender({ posts: postsB });
    expect(result.current).not.toBe(first);
    expect(result.current.posts).toBe(postsB);
  });
});
