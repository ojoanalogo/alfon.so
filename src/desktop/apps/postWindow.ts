/** Slug helpers + IDs shared by the post window registry and the runtime. */

export const POST_WINDOW_PREFIX = 'post:';
export const BROWSER_APP_ID = 'browser';
export const TRASH_APP_ID = 'trash';

export function postWindowId(slug: string): string {
  return `${POST_WINDOW_PREFIX}${slug}`;
}

export function isPostWindowId(id: string): boolean {
  return id.startsWith(POST_WINDOW_PREFIX);
}

export function postSlugFromWindowId(id: string): string {
  return id.slice(POST_WINDOW_PREFIX.length);
}
