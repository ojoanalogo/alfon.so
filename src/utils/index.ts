import type { CollectionEntry } from 'astro:content';

export function sortMDByDate(posts: CollectionEntry<'blog'>[] = []) {
  // Copy before sorting — Array.prototype.sort mutates in place, and callers pass
  // arrays they reuse (e.g. the live result of getPublishedPosts()).
  return [...posts].sort(
    (a, b) => new Date(b.data.publishDate).valueOf() - new Date(a.data.publishDate).valueOf(),
  );
}
