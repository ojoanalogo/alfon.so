import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDesktopAppContextValue } from './useAppContext';
import { BROWSER_APP_ID, postWindowId } from '../lib/appIds';
import { makeBlogPost } from '@test/factories';
import type { BlogPostSummary } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import type { AppDefinition } from '@desktop/wrappers';

/** Build the params object the hook requires, with vi.fn() stubs by default. */
function makeParams(overrides: Partial<Parameters<typeof useDesktopAppContextValue>[0]> = {}) {
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
  const apps: AppDefinition[] = [
    { id: 'terminal', title: 'Terminal', geometry: { defaultWidth: 600 }, render: () => null },
    { id: 'happy', title: 'Happy', geometry: { defaultWidth: 600 }, render: () => null },
  ];
  return {
    apps,
    posts,
    openWindow: vi.fn(),
    browsers,
    trash,
    desktopIconUrls,
    correctLayout: vi.fn(),
    ...overrides,
  };
}

describe('useDesktopAppContextValue', () => {
  it('wires the returned object straight through from params', () => {
    const posts = [makeBlogPost({ slug: 'a' })];
    const params = makeParams({ posts });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    expect(result.current.appContext.posts).toBe(posts);
    expect(result.current.appContext.browsers).toBe(params.browsers);
    expect(result.current.appContext.trash).toBe(params.trash);
    expect(result.current.appContext.iconUrls).toBe(params.desktopIconUrls);
  });

  it('exposes iconUrls from the desktopIconUrls param', () => {
    const desktopIconUrls: DesktopIconUrls = {
      blog: '/blog.png',
      notes: '/notes.png',
    } as DesktopIconUrls;
    const params = makeParams({ desktopIconUrls });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    expect(result.current.appContext.iconUrls).toEqual({ blog: '/blog.png', notes: '/notes.png' });
  });

  it('onOpenApp is the openWindow callback verbatim', () => {
    const openWindow = vi.fn();
    const params = makeParams({ openWindow });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    expect(result.current.appContext.onOpenApp).toBe(openWindow);

    act(() => result.current.appContext.onOpenApp('terminal'));
    expect(openWindow).toHaveBeenCalledWith('terminal');
  });

  it('onOpenPost opens the window keyed by the post slug', () => {
    const openWindow = vi.fn();
    const params = makeParams({ openWindow });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    act(() => result.current.appContext.onOpenPost('my-slug'));
    expect(openWindow).toHaveBeenCalledWith(postWindowId('my-slug'));
    expect(openWindow).toHaveBeenCalledTimes(1);
  });

  it('onOpenLink navigates the browser, sets geometry, and opens the browser window', () => {
    const openWindow = vi.fn();
    const correctLayout = vi.fn();
    const navigate = vi.fn((_id: string, url: string) => url);
    const params = makeParams({
      openWindow,
      correctLayout,
      browsers: { ...makeParams().browsers, navigate },
    });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    act(() => result.current.appContext.onOpenLink('https://example.com'));

    expect(navigate).toHaveBeenCalledWith(BROWSER_APP_ID, 'https://example.com');
    expect(correctLayout).toHaveBeenCalledWith(BROWSER_APP_ID, { height: 520 });
    expect(openWindow).toHaveBeenCalledWith(BROWSER_APP_ID);
  });

  it('onOpenLink bails out (no geometry / no open) when navigate returns falsy', () => {
    const openWindow = vi.fn();
    const correctLayout = vi.fn();
    const navigate = vi.fn(() => null);
    const params = makeParams({
      openWindow,
      correctLayout,
      browsers: { ...makeParams().browsers, navigate },
    });
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    act(() => result.current.appContext.onOpenLink('not-a-url'));

    expect(navigate).toHaveBeenCalledWith(BROWSER_APP_ID, 'not-a-url');
    expect(correctLayout).not.toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('memoizes the context across rerenders with stable inputs', () => {
    const params = makeParams();
    const { result, rerender } = renderHook(() => useDesktopAppContextValue(params));
    const first = result.current.appContext;

    rerender();
    expect(result.current.appContext).toBe(first);
  });

  it('recomputes the context when posts change', () => {
    const postsA = [makeBlogPost({ slug: 'a' })];
    const postsB = [makeBlogPost({ slug: 'b' })];
    const base = makeParams();

    const { result, rerender } = renderHook(
      ({ posts }) => useDesktopAppContextValue({ ...base, posts }),
      {
        initialProps: { posts: postsA },
      },
    );
    const first = result.current.appContext;

    rerender({ posts: postsB });
    expect(result.current.appContext).not.toBe(first);
    expect(result.current.appContext.posts).toBe(postsB);
  });

  it('findApp returns the matching runtime app definition', () => {
    const params = makeParams();
    const { result } = renderHook(() => useDesktopAppContextValue(params));

    expect(result.current.appContext.findApp('terminal')).toBe(params.apps[0]);
    expect(result.current.appContext.findApp('happy')).toBe(params.apps[1]);
    expect(result.current.appContext.findApp('missing')).toBeUndefined();
    expect(result.current.appContext.findApp('')).toBeUndefined();
  });

  it('recomputes findApp when the apps list changes', () => {
    const appsA: AppDefinition[] = [
      { id: 'a', title: 'A', geometry: { defaultWidth: 600 }, render: () => null },
    ];
    const appsB: AppDefinition[] = [
      { id: 'b', title: 'B', geometry: { defaultWidth: 600 }, render: () => null },
    ];
    const base = makeParams();

    const { result, rerender } = renderHook(
      ({ apps }) => useDesktopAppContextValue({ ...base, apps }),
      {
        initialProps: { apps: appsA },
      },
    );

    expect(result.current.appContext.findApp('a')).toBe(appsA[0]);
    expect(result.current.appContext.findApp('b')).toBeUndefined();

    rerender({ apps: appsB });
    expect(result.current.appContext.findApp('a')).toBeUndefined();
    expect(result.current.appContext.findApp('b')).toBe(appsB[0]);
  });

  it('onOpenNote stores a pending selection and notifies bridge subscribers', () => {
    const params = makeParams();
    const { result } = renderHook(() => useDesktopAppContextValue(params));
    const listener = vi.fn();

    const unsubscribe = result.current.noteOpenBridge.subscribePendingNoteOpen(listener);
    act(() => result.current.appContext.onOpenNote('note-1', 'edit'));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(result.current.noteOpenBridge.consumePendingNoteOpen()).toEqual({
      noteId: 'note-1',
      mode: 'edit',
    });
    expect(result.current.noteOpenBridge.consumePendingNoteOpen()).toBeNull();

    unsubscribe();
  });
});
