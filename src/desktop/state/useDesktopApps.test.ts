import { describe, it, expect } from 'vitest';
import { renderHook, waitFor as rtlWaitFor } from '@testing-library/react';
import { useDesktopApps } from './useDesktopApps';
import { CORE_APPS, GAME_IDS } from '../apps/registry';
import { postWindowId } from '../lib/appIds';
import { makeBlogPost } from '@test/factories';

const blogIsGated = CORE_APPS.some(
  (app) => app.id === 'blog' && typeof app.availableWhen === 'function',
);

describe('useDesktopApps', () => {
  it('derives the always-available registry apps when there are no posts', async () => {
    const { result } = renderHook(() => useDesktopApps([]));
    await rtlWaitFor(() => {
      expect(result.current.gamesReady).toBe(true);
    });
    const ids = result.current.apps.map((app) => app.id);

    expect(ids).toContain('terminal');
    expect(ids).toContain('about');
    expect(ids).toContain('browser');

    expect(ids.some((id) => id.startsWith('post:'))).toBe(false);
  });

  it('loads lazy game apps after mount', async () => {
    const { result } = renderHook(() => useDesktopApps([]));
    await rtlWaitFor(() => {
      expect(result.current.gamesReady).toBe(true);
    });
    const ids = result.current.apps.map((app) => app.id);
    for (const id of GAME_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('omits posts-gated apps (blog) when there are no posts', async () => {
    const { result } = renderHook(() => useDesktopApps([]));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const ids = result.current.apps.map((app) => app.id);

    if (blogIsGated) {
      expect(ids).not.toContain('blog');
    } else {
      expect(ids).toContain('blog');
    }
  });

  it('includes posts-gated apps and a per-post app when posts are present', async () => {
    const posts = [makeBlogPost({ slug: 'hello', title: 'Hello World' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const ids = result.current.apps.map((app) => app.id);

    expect(ids).toContain('blog');
    expect(ids).toContain(postWindowId('hello'));
    expect(ids).toContain('post:hello');
  });

  it('appends one post app per post, after the core apps and games', async () => {
    const posts = [
      makeBlogPost({ slug: 'one' }),
      makeBlogPost({ slug: 'two' }),
      makeBlogPost({ slug: 'three' }),
    ];
    const { result } = renderHook(() => useDesktopApps(posts));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const ids = result.current.apps.map((app) => app.id);

    expect(ids).toContain('post:one');
    expect(ids).toContain('post:two');
    expect(ids).toContain('post:three');

    const firstPostIndex = ids.findIndex((id) => id.startsWith('post:'));
    const lastNonPostIndex = ids.reduce((acc, id, i) => (id.startsWith('post:') ? acc : i), -1);
    expect(firstPostIndex).toBeGreaterThan(lastNonPostIndex);
  });

  it('builds one window def per app, mirroring app ids', async () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const { apps, defs } = result.current;

    expect(defs.length).toBe(apps.length);
    expect(defs.map((d) => d.id)).toEqual(apps.map((a) => a.id));
  });

  it('produces defs covering core apps, games, and the post app', async () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const defIds = result.current.defs.map((d) => d.id);

    expect(defIds).toContain('terminal');
    expect(defIds).toContain('blog');
    expect(defIds).toContain('snake');
    expect(defIds).toContain('post:hello');
  });

  it('gives each def default placement and a z-index', async () => {
    const { result } = renderHook(() => useDesktopApps([]));
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const def = result.current.defs.find((d) => d.id === 'terminal');

    expect(def).toBeTruthy();
    expect(def!.defaultX).toBe(0);
    expect(def!.defaultY).toBe(0);
    expect(typeof def!.initialZ).toBe('number');
    expect('title' in def!).toBe(false);
  });

  it('memoizes apps and defs across rerenders with the same posts array', async () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result, rerender } = renderHook(({ posts }) => useDesktopApps(posts), {
      initialProps: { posts },
    });
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const firstApps = result.current.apps;
    const firstDefs = result.current.defs;

    rerender({ posts });
    expect(result.current.apps).toBe(firstApps);
    expect(result.current.defs).toBe(firstDefs);
  });

  it('recomputes apps and defs when the posts array changes', async () => {
    const postsA = [makeBlogPost({ slug: 'a' })];
    const postsB = [makeBlogPost({ slug: 'b' })];
    const { result, rerender } = renderHook(({ posts }) => useDesktopApps(posts), {
      initialProps: { posts: postsA },
    });
    await rtlWaitFor(() => expect(result.current.gamesReady).toBe(true));
    const firstApps = result.current.apps;

    rerender({ posts: postsB });
    await rtlWaitFor(() => expect(result.current.apps.map((a) => a.id)).toContain('post:b'));
    expect(result.current.apps).not.toBe(firstApps);
    expect(result.current.apps.map((a) => a.id)).not.toContain('post:a');
  });
});
