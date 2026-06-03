import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  render: vi.fn(async () => ({ Content: () => null })),
}));

import { getCollection } from 'astro:content';
import { getPublishedPosts } from './blog';

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
