/**
 * Hosts that refuse to be embedded in an `<iframe>` via `X-Frame-Options` or a CSP
 * `frame-ancestors` directive. A blocked frame just renders blank, and — being
 * cross-origin — the parent page can't detect the failure at runtime. So we keep a
 * list of the well-known offenders and show an "open in a new tab" fallback instead
 * of a dead pane. Matching is suffix-based, so subdomains (e.g. `gist.github.com`)
 * are covered too.
 */
export const FRAME_BLOCKED_HOSTS = [
  'github.com',
  'x.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com',
  'youtube.com',
  'google.com',
] as const;

/** True when `url` points at a host known to refuse iframe embedding. */
export function isFrameBlockedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return FRAME_BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function normalizeBrowserUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'about:blank') return null;

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}
