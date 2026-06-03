import type { CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import { marked } from 'marked';
import readingTime from 'reading-time';
import { getCollection, render } from 'astro:content';
import type { BlogPostSummary } from '@/desktop/types';

/**
 * Published posts only. Drafts (`published: false` in frontmatter) are hidden
 * in production builds but stay visible in `astro dev` so they can be authored.
 * Single source for every blog call site so the index, static post pages, and
 * the desktop never disagree on what is live.
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  return getCollection('blog', (entry) => import.meta.env.DEV || entry.data.published !== false);
}

/**
 * Turn an Astro content entry into the serializable BlogPostSummary that
 * gets sent to the React desktop. Centralized so the desktop and any
 * future static blog summary list build from the same shape.
 */
/**
 * The rendered HTML Astro attaches to an entry after `render()`. Not part of the
 * public `CollectionEntry` type, hence the cast — isolated here so the access is
 * named and the missing-HTML fallback below can be made observable.
 */
function prerenderedHtml(entry: CollectionEntry<'blog'>): string | undefined {
  return (entry as unknown as { rendered?: { html?: string } }).rendered?.html;
}

export async function prepareBlogPost(
  entry: CollectionEntry<'blog'>,
  options: { heroWidth?: number } = {},
): Promise<BlogPostSummary> {
  await render(entry);
  const rendered = prerenderedHtml(entry);
  if (!rendered && import.meta.env.DEV) {
    console.warn(`[blog] No prerendered HTML for "${entry.id}"; falling back to marked.parse.`);
  }
  const html = rendered ?? (await marked.parse(entry.body ?? ''));

  let heroImageSrc: string | undefined;
  if (entry.data.heroImage) {
    const image = await getImage({ src: entry.data.heroImage, width: options.heroWidth ?? 1200 });
    heroImageSrc = image.src;
  }

  const stats = readingTime(entry.body ?? '');

  return {
    title: entry.data.title,
    slug: entry.id,
    publishDate: new Date(entry.data.publishDate).toISOString(),
    description: entry.data.description,
    readingTime: stats.text,
    tags: entry.data.tags ?? [],
    heroImageSrc,
    heroImageAlt: entry.data.title,
    html,
  };
}
