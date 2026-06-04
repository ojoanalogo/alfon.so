import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  render: vi.fn(async () => ({ Content: () => null })),
}));

vi.mock('astro:assets', () => ({
  getImage: vi.fn(async () => ({ src: '/optimized.jpg' })),
}));

import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import { getPublishedPosts, prepareBlogPost } from './blog';

type Entry = { id: string; data: { published?: boolean; publishDate: string }; body: string };

const ENTRIES: Entry[] = [
  { id: 'published', data: { published: true, publishDate: '2024-01-01' }, body: '' },
  { id: 'draft', data: { published: false, publishDate: '2024-02-01' }, body: '' },
  { id: 'unset', data: { publishDate: '2024-03-01' }, body: '' },
];

beforeEach(() => {
  // Emulate Astro's getCollection(collection, filter) contract.
  vi.mocked(getCollection).mockImplementation((async (
    _c: string,
    filter?: (e: Entry) => boolean,
  ) => (filter ? ENTRIES.filter(filter) : ENTRIES)) as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('getPublishedPosts', () => {
  it('keeps every post in dev so drafts stay authorable', async () => {
    vi.stubEnv('DEV', true);
    const ids = (await getPublishedPosts()).map((p) => p.id);
    expect(ids).toEqual(['published', 'draft', 'unset']);
  });

  it('excludes only published:false posts in production', async () => {
    vi.stubEnv('DEV', false);
    const ids = (await getPublishedPosts()).map((p) => p.id);
    expect(ids).toContain('published');
    expect(ids).toContain('unset'); // undefined published is treated as live
    expect(ids).not.toContain('draft');
  });
});

describe('prepareBlogPost', () => {
  type BlogEntry = Parameters<typeof prepareBlogPost>[0];

  function makeEntry(data: Record<string, unknown> = {}, body = '# Hello\n\nbody text'): BlogEntry {
    return {
      id: 'my-post',
      body,
      data: { title: 'My Post', publishDate: '2024-05-01', description: 'desc', tags: ['a'], ...data },
    } as unknown as BlogEntry;
  }

  it('falls back to marked.parse when there is no prerendered HTML', async () => {
    const post = await prepareBlogPost(makeEntry());
    expect(post.html).toContain('<h1>Hello</h1>');
    expect(post.html).toContain('body text');
  });

  it('maps frontmatter and reading time into the summary', async () => {
    const post = await prepareBlogPost(makeEntry());
    expect(post.title).toBe('My Post');
    expect(post.slug).toBe('my-post');
    expect(post.publishDate).toBe(new Date('2024-05-01').toISOString());
    expect(post.description).toBe('desc');
    expect(post.tags).toEqual(['a']);
    expect(post.readingTime).toBeTruthy();
    expect(post.heroImageSrc).toBeUndefined();
  });

  it('defaults tags to an empty array when frontmatter omits them', async () => {
    const post = await prepareBlogPost(makeEntry({ tags: undefined }));
    expect(post.tags).toEqual([]);
  });

  it('optimizes the hero image with the requested width', async () => {
    const heroImage = { src: '/hero.jpg' };
    const post = await prepareBlogPost(makeEntry({ heroImage }), { heroWidth: 800 });
    expect(getImage).toHaveBeenCalledWith({ src: heroImage, width: 800 });
    expect(post.heroImageSrc).toBe('/optimized.jpg');
    expect(post.heroImageAlt).toBe('My Post');
  });

  it('defaults the hero image width to 1200', async () => {
    const heroImage = { src: '/hero.jpg' };
    await prepareBlogPost(makeEntry({ heroImage }));
    expect(getImage).toHaveBeenCalledWith({ src: heroImage, width: 1200 });
  });
});
