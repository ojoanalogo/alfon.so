import { describe, it, expect } from 'vitest';
import { NAV_LINKS, SOCIAL_LINKS } from './index';

// Data-integrity checks for the static link lists: they catch real editing
// mistakes (broken URLs, duplicate entries). Type shapes are TypeScript's job
// and are not re-asserted here.

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

describe('config: NAV_LINKS', () => {
  it('every link declares a url or a redirect — never both, never neither', () => {
    expect(NAV_LINKS.length).toBeGreaterThan(0);
    for (const link of NAV_LINKS) {
      const hasUrl = typeof link.url === 'string' && link.url.length > 0;
      const hasRedirect = typeof link.redirect === 'string' && link.redirect.length > 0;
      expect(hasUrl !== hasRedirect).toBe(true);
    }
  });

  it('internal urls are root-relative and redirects are absolute https', () => {
    for (const link of NAV_LINKS) {
      if (link.url) expect(link.url.startsWith('/')).toBe(true);
      if (link.redirect) expect(isHttpsUrl(link.redirect)).toBe(true);
    }
  });

  it('declared ids are unique', () => {
    const ids = NAV_LINKS.map((l) => l.id).filter((id): id is string => typeof id === 'string');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains the expected home and blog entry points', () => {
    expect(NAV_LINKS.find((l) => l.id === 'home')?.url).toBe('/');
    expect(NAV_LINKS.find((l) => l.id === 'blog')?.url).toBe('/blog');
  });
});

describe('config: SOCIAL_LINKS', () => {
  it('platforms are unique and every url is absolute https', () => {
    expect(SOCIAL_LINKS.length).toBeGreaterThan(0);
    const platforms = SOCIAL_LINKS.map((l) => l.platform);
    expect(new Set(platforms).size).toBe(platforms.length);
    for (const link of SOCIAL_LINKS) {
      expect(isHttpsUrl(link.url)).toBe(true);
    }
  });
});
