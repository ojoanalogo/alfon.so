/**
 * App/window-id constants and post-window slug helpers, shared across every layer
 * (apps, state, shell). App-agnostic infrastructure — lives in lib so state/shell
 * never have to reach into an app folder for a well-known window id.
 */

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
