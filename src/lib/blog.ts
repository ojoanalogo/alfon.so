import type { CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import { marked } from 'marked';
import readingTime from 'reading-time';
import { render } from 'astro:content';
import type { BlogPostSummary } from '../components/desktop/react/types';

/**
 * Turn an Astro content entry into the serializable BlogPostSummary that
 * gets sent to the React desktop. Centralized so the desktop and any
 * future static blog summary list build from the same shape.
 */
export async function prepareBlogPost(
  entry: CollectionEntry<'blog'>,
  options: { heroWidth?: number } = {},
): Promise<BlogPostSummary> {
  await render(entry);
  const rendered = (entry as unknown as { rendered?: { html?: string } }).rendered?.html;
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
