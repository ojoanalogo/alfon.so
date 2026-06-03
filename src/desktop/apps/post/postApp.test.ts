import { describe, it, expect } from 'vitest';
import { makeBlogPost } from '@test/factories';
import { createPostApps, findPostBySlug } from './postApp';
import {
  postWindowId,
  isPostWindowId,
  postSlugFromWindowId,
  POST_WINDOW_PREFIX,
} from '../../lib/appIds';

describe('postWindow id helpers', () => {
  it('prefixes the slug with the post window prefix', () => {
    expect(postWindowId('hello-world')).toBe('post:hello-world');
    expect(postWindowId('hello-world').startsWith(POST_WINDOW_PREFIX)).toBe(true);
  });

  it('round-trips a slug through id derivation and extraction', () => {
    const slug = 'my-cool-post';
    const id = postWindowId(slug);
    expect(postSlugFromWindowId(id)).toBe(slug);
  });

  it('round-trips slugs that themselves contain a colon', () => {
    const slug = 'weird:slug:with:colons';
    const id = postWindowId(slug);
    // Only the leading prefix is stripped, the rest of the slug survives.
    expect(postSlugFromWindowId(id)).toBe(slug);
  });

  it('handles an empty slug', () => {
    const id = postWindowId('');
    expect(id).toBe('post:');
    expect(postSlugFromWindowId(id)).toBe('');
    expect(isPostWindowId(id)).toBe(true);
  });

  it('isPostWindowId discriminates by prefix', () => {
    expect(isPostWindowId('post:abc')).toBe(true);
    expect(isPostWindowId('post:')).toBe(true);
    expect(isPostWindowId('browser')).toBe(false);
    expect(isPostWindowId('trash')).toBe(false);
    expect(isPostWindowId('postman')).toBe(false); // no colon -> not a post window
  });
});

describe('createPostApps', () => {
  it('creates one app definition per post', () => {
    const posts = [
      makeBlogPost({ slug: 'a', title: 'Post A' }),
      makeBlogPost({ slug: 'b', title: 'Post B' }),
      makeBlogPost({ slug: 'c', title: 'Post C' }),
    ];
    const apps = createPostApps(posts);
    expect(apps).toHaveLength(3);
  });

  it('returns an empty array for no posts', () => {
    expect(createPostApps([])).toEqual([]);
  });

  it('derives the id from the post slug via postWindowId', () => {
    const post = makeBlogPost({ slug: 'derived-id' });
    const [app] = createPostApps([post]);
    expect(app.id).toBe(postWindowId('derived-id'));
    expect(app.id).toBe('post:derived-id');
  });

  it('sets the title to "<slug>.md" and tooltip to the post title', () => {
    const post = makeBlogPost({ slug: 'readme', title: 'Human Readable Title' });
    const [app] = createPostApps([post]);
    expect(app.title).toBe('readme.md');
    expect(app.taskbarTooltip).toBe('Human Readable Title');
  });

  it('uses the blog icon and hides the desktop icon', () => {
    const [app] = createPostApps([makeBlogPost()]);
    expect(app.iconKey).toBe('blog');
    expect(app.desktopIcon).toBe(false);
  });

  it('sets a fixed default width and an index-offset z-order', () => {
    const posts = [
      makeBlogPost({ slug: 'first' }),
      makeBlogPost({ slug: 'second' }),
    ];
    const apps = createPostApps(posts);
    expect(apps[0].geometry.defaultWidth).toBe(640);
    expect(apps[0].geometry.initialZ).toBe(20);
    expect(apps[1].geometry.initialZ).toBe(21);
  });

  it('exposes a render function (from defineApp)', () => {
    const [app] = createPostApps([makeBlogPost()]);
    expect(typeof app.render).toBe('function');
  });
});

describe('findPostBySlug', () => {
  const posts = [
    makeBlogPost({ slug: 'alpha', title: 'Alpha' }),
    makeBlogPost({ slug: 'beta', title: 'Beta' }),
    makeBlogPost({ slug: 'gamma', title: 'Gamma' }),
  ];

  it('finds a post by round-tripping its window id', () => {
    const target = posts[1];
    const found = findPostBySlug(posts, postWindowId(target.slug));
    expect(found).toBe(target);
  });

  it('round-trips every post id back to the matching post', () => {
    for (const post of posts) {
      const found = findPostBySlug(posts, postWindowId(post.slug));
      expect(found?.slug).toBe(post.slug);
    }
  });

  it('returns undefined when no post matches the window id', () => {
    expect(findPostBySlug(posts, postWindowId('does-not-exist'))).toBeUndefined();
  });

  it('returns undefined when searching an empty post list', () => {
    expect(findPostBySlug([], postWindowId('alpha'))).toBeUndefined();
  });

  it('integrates with createPostApps: each generated app id resolves to its post', () => {
    const apps = createPostApps(posts);
    apps.forEach((app, i) => {
      expect(findPostBySlug(posts, app.id)).toBe(posts[i]);
    });
  });
});
