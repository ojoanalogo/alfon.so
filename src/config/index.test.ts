import { describe, it, expect } from 'vitest';
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  NAV_LINKS,
  SOCIAL_LINKS,
  type NavLink,
  type SocialLink,
  type SocialPlatform,
} from './index';

// NOTE: The task brief mentions DESKTOP_ICON_DEFINITIONS, but config.ts no
// longer exports it — per the in-file comment the desktop icon defs moved to
// src/desktop/apps/registry.ts. config.ts only exports the
// DesktopIconDefinition *interface* (a type, not a runtime value), so there is
// nothing to assert structurally here. We validate NAV_LINKS and SOCIAL_LINKS,
// which are the constant arrays this file actually owns.

const isHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

describe('config: site metadata', () => {
  it('exposes non-empty site title and description', () => {
    expect(typeof SITE_TITLE).toBe('string');
    expect(SITE_TITLE.length).toBeGreaterThan(0);
    expect(typeof SITE_DESCRIPTION).toBe('string');
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });
});

describe('config: NAV_LINKS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(NAV_LINKS)).toBe(true);
    expect(NAV_LINKS.length).toBeGreaterThan(0);
  });

  it('every link has a non-empty title', () => {
    for (const link of NAV_LINKS) {
      expect(typeof link.title).toBe('string');
      expect(link.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('every link has either a url or a redirect, never both missing', () => {
    for (const link of NAV_LINKS) {
      const hasUrl = typeof link.url === 'string' && link.url.length > 0;
      const hasRedirect = typeof link.redirect === 'string' && link.redirect.length > 0;
      expect(hasUrl || hasRedirect).toBe(true);
    }
  });

  it('internal urls are root-relative paths starting with "/"', () => {
    const internal = NAV_LINKS.filter((l) => typeof l.url === 'string');
    expect(internal.length).toBeGreaterThan(0);
    for (const link of internal) {
      expect(link.url!.startsWith('/')).toBe(true);
    }
  });

  it('redirects are absolute https URLs', () => {
    const redirects = NAV_LINKS.filter((l) => typeof l.redirect === 'string');
    expect(redirects.length).toBeGreaterThan(0);
    for (const link of redirects) {
      expect(isHttpsUrl(link.redirect!)).toBe(true);
    }
  });

  it('a link does not declare both url and redirect (mutually exclusive)', () => {
    for (const link of NAV_LINKS) {
      const hasUrl = typeof link.url === 'string';
      const hasRedirect = typeof link.redirect === 'string';
      expect(hasUrl && hasRedirect).toBe(false);
    }
  });

  it('all declared ids are unique', () => {
    const ids = NAV_LINKS.map((l) => l.id).filter((id): id is string => typeof id === 'string');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids, when present, are non-empty strings', () => {
    for (const link of NAV_LINKS) {
      if (link.id !== undefined) {
        expect(typeof link.id).toBe('string');
        expect(link.id.length).toBeGreaterThan(0);
      }
    }
  });

  it('tooltips, when present, are non-empty strings', () => {
    for (const link of NAV_LINKS) {
      if (link.tooltip !== undefined) {
        expect(typeof link.tooltip).toBe('string');
        expect(link.tooltip.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('titles are unique across nav links', () => {
    const titles = NAV_LINKS.map((l) => l.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('contains the expected home and blog entry points', () => {
    const home = NAV_LINKS.find((l) => l.id === 'home');
    const blog = NAV_LINKS.find((l) => l.id === 'blog');
    expect(home?.url).toBe('/');
    expect(blog?.url).toBe('/blog');
  });
});

describe('config: SOCIAL_LINKS', () => {
  const allowedPlatforms: SocialPlatform[] = ['twitter', 'github', 'instagram', 'linkedin'];

  it('is a non-empty array', () => {
    expect(Array.isArray(SOCIAL_LINKS)).toBe(true);
    expect(SOCIAL_LINKS.length).toBeGreaterThan(0);
  });

  it('every entry has all required fields as non-empty strings', () => {
    for (const link of SOCIAL_LINKS) {
      expect(typeof link.platform).toBe('string');
      expect(link.platform.length).toBeGreaterThan(0);
      expect(typeof link.url).toBe('string');
      expect(link.url.length).toBeGreaterThan(0);
      expect(typeof link.label).toBe('string');
      expect(link.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('every platform is one of the allowed SocialPlatform values', () => {
    for (const link of SOCIAL_LINKS) {
      expect(allowedPlatforms).toContain(link.platform);
    }
  });

  it('platforms are unique (no duplicate social entries)', () => {
    const platforms = SOCIAL_LINKS.map((l) => l.platform);
    expect(new Set(platforms).size).toBe(platforms.length);
  });

  it('every url is a well-formed absolute https URL', () => {
    for (const link of SOCIAL_LINKS) {
      expect(isHttpsUrl(link.url)).toBe(true);
    }
  });

  it('labels are unique', () => {
    const labels = SOCIAL_LINKS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('covers the four known platforms', () => {
    const platforms = SOCIAL_LINKS.map((l) => l.platform).sort();
    expect(platforms).toEqual([...allowedPlatforms].sort());
  });
});

describe('config: type-level shape sanity (runtime guards mirror interfaces)', () => {
  it('NavLink optional keys are not unexpectedly populated with wrong types', () => {
    const link: NavLink = NAV_LINKS[0];
    // url/redirect/id/tooltip are all string | undefined; ensure no nulls/objects leaked in.
    for (const value of [link.id, link.url, link.redirect, link.tooltip]) {
      expect(value === undefined || typeof value === 'string').toBe(true);
    }
  });

  it('SocialLink entries contain no extra null/undefined required fields', () => {
    const link: SocialLink = SOCIAL_LINKS[0];
    expect(link.platform).toBeDefined();
    expect(link.url).toBeDefined();
    expect(link.label).toBeDefined();
  });
});
