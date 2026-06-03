import { describe, it, expect } from 'vitest';
import { makeAppContext, makeBlogPost } from '@test/factories';
import { APPS, findApp, createPostApps, findPostBySlug } from './registry';
import { postWindowId, isPostWindowId } from '../lib/appIds';

describe('APPS registry', () => {
  it('is a non-empty list', () => {
    expect(APPS.length).toBeGreaterThan(0);
  });

  it('has a unique id for every app', () => {
    const ids = APPS.map((app) => app.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('gives every app a non-empty string id', () => {
    for (const app of APPS) {
      expect(typeof app.id).toBe('string');
      expect(app.id.length).toBeGreaterThan(0);
    }
  });

  it('gives every app a render function', () => {
    for (const app of APPS) {
      expect(typeof app.render).toBe('function');
    }
  });

  it('gives every app geometry with a numeric defaultWidth', () => {
    for (const app of APPS) {
      expect(app.geometry).toBeTruthy();
      expect(typeof app.geometry.defaultWidth).toBe('number');
      expect(app.geometry.defaultWidth).toBeGreaterThan(0);
    }
  });

  it('gives every app a resolvable title (string or function)', () => {
    const ctx = makeAppContext();
    for (const app of APPS) {
      const title = typeof app.title === 'function' ? app.title(ctx) : app.title;
      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
    }
  });

  it('includes the core apps by id', () => {
    const ids = new Set<string>(APPS.map((app) => app.id));
    for (const id of ['terminal', 'about', 'projects', 'blog', 'browser', 'trash']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('does not include any dynamic post apps (those are created at runtime)', () => {
    for (const app of APPS) {
      expect(isPostWindowId(app.id)).toBe(false);
    }
  });

  it('keeps terminal first so it anchors the start menu / icon order', () => {
    expect(APPS[0].id).toBe('terminal');
  });
});

describe('findApp', () => {
  it('returns the matching app for a known id', () => {
    for (const app of APPS) {
      expect(findApp(app.id)).toBe(app);
    }
  });

  it('returns undefined for an unknown id', () => {
    expect(findApp('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty id', () => {
    expect(findApp('')).toBeUndefined();
  });

  it('does not match a dynamic post id (not in the static registry)', () => {
    expect(findApp(postWindowId('some-post'))).toBeUndefined();
  });

  it('is case-sensitive on the id', () => {
    expect(findApp('Terminal')).toBeUndefined();
    expect(findApp('terminal')).toBeTruthy();
  });
});

describe('re-exported post helpers', () => {
  it('createPostApps builds one app per post and findApp does not see them', () => {
    const posts = [
      makeBlogPost({ slug: 'one', title: 'One' }),
      makeBlogPost({ slug: 'two', title: 'Two' }),
    ];
    const postApps = createPostApps(posts);
    expect(postApps).toHaveLength(2);
    for (const app of postApps) {
      expect(isPostWindowId(app.id)).toBe(true);
      // Dynamic apps live outside the static registry.
      expect(findApp(app.id)).toBeUndefined();
    }
  });

  it('findPostBySlug round-trips a generated post app id back to its post', () => {
    const posts = [makeBlogPost({ slug: 'alpha' }), makeBlogPost({ slug: 'beta' })];
    const postApps = createPostApps(posts);
    postApps.forEach((app, i) => {
      expect(findPostBySlug(posts, app.id)).toBe(posts[i]);
    });
    expect(findPostBySlug(posts, postWindowId('missing'))).toBeUndefined();
  });

  it('isPostWindowId discriminates post ids from registry ids', () => {
    expect(isPostWindowId(postWindowId('x'))).toBe(true);
    expect(isPostWindowId('terminal')).toBe(false);
  });
});
