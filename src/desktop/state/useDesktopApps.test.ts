import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDesktopApps } from './useDesktopApps';
import { APPS } from '../apps/registry';
import { postWindowId } from '../apps/postWindow';
import { makeBlogPost } from '@test/factories';

// Registry apps that are gated by availableWhen (blog requires posts.length > 0).
const blogIsGated = APPS.some(
  (app) => app.id === 'blog' && typeof app.availableWhen === 'function',
);

describe('useDesktopApps', () => {
  it('derives the always-available registry apps when there are no posts', () => {
    const { result } = renderHook(() => useDesktopApps([]));
    const ids = result.current.apps.map((app) => app.id);

    // A few stable, ungated registry apps should always be present.
    expect(ids).toContain('terminal');
    expect(ids).toContain('about');
    expect(ids).toContain('browser');

    // No post apps when there are no posts.
    expect(ids.some((id) => id.startsWith('post:'))).toBe(false);
  });

  it('omits posts-gated apps (blog) when there are no posts', () => {
    const { result } = renderHook(() => useDesktopApps([]));
    const ids = result.current.apps.map((app) => app.id);

    if (blogIsGated) {
      expect(ids).not.toContain('blog');
    } else {
      expect(ids).toContain('blog');
    }
  });

  it('includes posts-gated apps and a per-post app when posts are present', () => {
    const posts = [makeBlogPost({ slug: 'hello', title: 'Hello World' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    const ids = result.current.apps.map((app) => app.id);

    // The blog app is unlocked once at least one post exists.
    expect(ids).toContain('blog');

    // The dynamic post app is appended.
    expect(ids).toContain(postWindowId('hello'));
    expect(ids).toContain('post:hello');
  });

  it('appends one post app per post, after the registry apps', () => {
    const posts = [
      makeBlogPost({ slug: 'one' }),
      makeBlogPost({ slug: 'two' }),
      makeBlogPost({ slug: 'three' }),
    ];
    const { result } = renderHook(() => useDesktopApps(posts));
    const ids = result.current.apps.map((app) => app.id);

    expect(ids).toContain('post:one');
    expect(ids).toContain('post:two');
    expect(ids).toContain('post:three');

    // Post apps come after all registry-derived apps.
    const firstPostIndex = ids.findIndex((id) => id.startsWith('post:'));
    const lastNonPostIndex = ids.reduce(
      (acc, id, i) => (id.startsWith('post:') ? acc : i),
      -1,
    );
    expect(firstPostIndex).toBeGreaterThan(lastNonPostIndex);
  });

  it('builds one window def per app, mirroring app ids', () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    const { apps, defs } = result.current;

    expect(defs.length).toBe(apps.length);
    expect(defs.map((d) => d.id)).toEqual(apps.map((a) => a.id));
  });

  it('produces defs covering registry apps and the post app', () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result } = renderHook(() => useDesktopApps(posts));
    const defIds = result.current.defs.map((d) => d.id);

    expect(defIds).toContain('terminal');
    expect(defIds).toContain('blog');
    expect(defIds).toContain('post:hello');
  });

  it('gives each def a title, default placement, and a z-index', () => {
    const { result } = renderHook(() => useDesktopApps([]));
    const def = result.current.defs.find((d) => d.id === 'terminal');

    expect(def).toBeTruthy();
    expect(typeof def!.title).toBe('string');
    expect(def!.title.length).toBeGreaterThan(0);
    expect(def!.defaultX).toBe(0);
    expect(def!.defaultY).toBe(0);
    expect(typeof def!.initialZ).toBe('number');
  });

  it('memoizes apps and defs across rerenders with the same posts array', () => {
    const posts = [makeBlogPost({ slug: 'hello' })];
    const { result, rerender } = renderHook(
      ({ posts }) => useDesktopApps(posts),
      { initialProps: { posts } },
    );
    const firstApps = result.current.apps;
    const firstDefs = result.current.defs;

    rerender({ posts });
    expect(result.current.apps).toBe(firstApps);
    expect(result.current.defs).toBe(firstDefs);
  });

  it('recomputes apps and defs when the posts array changes', () => {
    const postsA = [makeBlogPost({ slug: 'a' })];
    const postsB = [makeBlogPost({ slug: 'b' })];
    const { result, rerender } = renderHook(
      ({ posts }) => useDesktopApps(posts),
      { initialProps: { posts: postsA } },
    );
    const firstApps = result.current.apps;

    rerender({ posts: postsB });
    expect(result.current.apps).not.toBe(firstApps);
    expect(result.current.apps.map((a) => a.id)).toContain('post:b');
    expect(result.current.apps.map((a) => a.id)).not.toContain('post:a');
  });
});
