/**
 * Date formatters and layout constants shared by every place that lists posts:
 * the static blog index, PostPreview.astro, and the React PostListItem.
 */

export const POST_DATE_MIN_WIDTH = 120;

export const postDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const postLongDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatReadingTime(minutes: number): string {
  const rounded = Math.max(1, Math.ceil(minutes));
  return `${rounded} min de lectura`;
}
