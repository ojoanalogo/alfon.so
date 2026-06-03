import { describe, it, expect } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { sortMDByDate } from './index';

type BlogEntry = CollectionEntry<'blog'>;

/** Build a minimal blog entry with just the field sortMDByDate reads. */
function entry(publishDate: string | Date): BlogEntry {
  return { data: { publishDate } } as unknown as BlogEntry;
}

/** Extract the publishDate values in order for easy assertions. */
function dates(posts: BlogEntry[]): Array<string | Date> {
  return posts.map((p) => p.data.publishDate);
}

describe('sortMDByDate', () => {
  it('sorts entries by publishDate descending (newest first)', () => {
    const posts = [
      entry('2024-01-01T00:00:00.000Z'),
      entry('2024-03-01T00:00:00.000Z'),
      entry('2024-02-01T00:00:00.000Z'),
    ];

    const result = sortMDByDate(posts);

    expect(dates(result)).toEqual([
      '2024-03-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
    ]);
  });

  it('returns a new sorted array without mutating the input', () => {
    const posts = [
      entry('2024-01-01T00:00:00.000Z'),
      entry('2024-05-01T00:00:00.000Z'),
    ];

    const result = sortMDByDate(posts);

    // A fresh array, not the same reference.
    expect(result).not.toBe(posts);
    // The original array keeps its original order.
    expect(dates(posts)).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-05-01T00:00:00.000Z',
    ]);
    // The returned array is sorted newest-first.
    expect(dates(result)).toEqual([
      '2024-05-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
    ]);
  });

  it('returns an empty array when called with no argument (default param)', () => {
    const result = sortMDByDate();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('returns an empty array when given an empty array', () => {
    const posts: BlogEntry[] = [];

    const result = sortMDByDate(posts);

    expect(result).toHaveLength(0);
  });

  it('returns a single-element array as-is', () => {
    const posts = [entry('2024-01-01T00:00:00.000Z')];

    const result = sortMDByDate(posts);

    expect(dates(result)).toEqual(['2024-01-01T00:00:00.000Z']);
  });

  it('leaves an already-sorted (descending) array in descending order', () => {
    const posts = [
      entry('2024-12-31T00:00:00.000Z'),
      entry('2024-06-15T00:00:00.000Z'),
      entry('2024-01-01T00:00:00.000Z'),
    ];

    const result = sortMDByDate(posts);

    expect(dates(result)).toEqual([
      '2024-12-31T00:00:00.000Z',
      '2024-06-15T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
    ]);
  });

  it('accepts Date objects as publishDate values', () => {
    const older = new Date('2020-01-01T00:00:00.000Z');
    const newer = new Date('2023-01-01T00:00:00.000Z');
    const posts = [entry(older), entry(newer)];

    const result = sortMDByDate(posts);

    expect(dates(result)).toEqual([newer, older]);
  });

  it('orders by full timestamp, not just calendar date', () => {
    const posts = [
      entry('2024-01-01T08:00:00.000Z'),
      entry('2024-01-01T20:00:00.000Z'),
      entry('2024-01-01T12:00:00.000Z'),
    ];

    const result = sortMDByDate(posts);

    expect(dates(result)).toEqual([
      '2024-01-01T20:00:00.000Z',
      '2024-01-01T12:00:00.000Z',
      '2024-01-01T08:00:00.000Z',
    ]);
  });

  it('keeps equal-date entries together (comparator returns 0)', () => {
    const a = entry('2024-04-04T00:00:00.000Z');
    const b = entry('2024-04-04T00:00:00.000Z');
    const posts = [a, b];

    const result = sortMDByDate(posts);

    expect(result).toHaveLength(2);
    expect(dates(result)).toEqual([
      '2024-04-04T00:00:00.000Z',
      '2024-04-04T00:00:00.000Z',
    ]);
  });
});
