import { describe, it, expect, vi, afterEach } from 'vitest';
import type { DesktopIconDefinition } from '@/config';
import {
  DESKTOP_ICON_URLS,
  resolveIconUrl,
  resolveDesktopIcons,
  type DesktopIconUrls,
} from './desktopIcons';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('DESKTOP_ICON_URLS', () => {
  it('exposes a mapping of icon keys to non-empty string urls', () => {
    const keys = Object.keys(DESKTOP_ICON_URLS);
    expect(keys.length).toBeGreaterThan(0);
    for (const value of Object.values(DESKTOP_ICON_URLS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('includes the expected well-known keys', () => {
    expect(DESKTOP_ICON_URLS).toHaveProperty('about');
    expect(DESKTOP_ICON_URLS).toHaveProperty('trash');
    expect(DESKTOP_ICON_URLS).toHaveProperty('trash-full');
    expect(DESKTOP_ICON_URLS).toHaveProperty('terminal');
  });
});

describe('resolveIconUrl', () => {
  it('returns the mapped url for a known key', () => {
    const urls: DesktopIconUrls = { about: '/icons/about.png', blog: '/icons/blog.png' };
    expect(resolveIconUrl(urls, 'about')).toBe('/icons/about.png');
    expect(resolveIconUrl(urls, 'blog')).toBe('/icons/blog.png');
  });

  it('works against the real DESKTOP_ICON_URLS map', () => {
    expect(resolveIconUrl(DESKTOP_ICON_URLS, 'terminal')).toBe(DESKTOP_ICON_URLS.terminal);
  });

  it('throws in DEV on an unknown key', () => {
    vi.stubEnv('DEV', true);
    const urls: DesktopIconUrls = { about: '/icons/about.png' };
    expect(() => resolveIconUrl(urls, 'missing')).toThrow(/Unknown icon key "missing"/);
  });

  it('throws in DEV when the mapped value is empty (falsy)', () => {
    vi.stubEnv('DEV', true);
    const urls: DesktopIconUrls = { about: '' };
    expect(() => resolveIconUrl(urls, 'about')).toThrow(/Unknown icon key "about"/);
  });

  it('returns "" in production on an unknown key (no throw)', () => {
    vi.stubEnv('DEV', false);
    const urls: DesktopIconUrls = { about: '/icons/about.png' };
    expect(resolveIconUrl(urls, 'missing')).toBe('');
  });

  it('still returns the mapped url in production for a known key', () => {
    vi.stubEnv('DEV', false);
    const urls: DesktopIconUrls = { about: '/icons/about.png' };
    expect(resolveIconUrl(urls, 'about')).toBe('/icons/about.png');
  });
});

describe('resolveDesktopIcons', () => {
  const urls: DesktopIconUrls = {
    about: '/icons/about.png',
    blog: '/icons/blog.png',
    terminal: '/icons/terminal.png',
  };

  const makeDef = (overrides: Partial<DesktopIconDefinition> = {}): DesktopIconDefinition => ({
    id: 'about',
    label: 'About',
    windowId: 'about-window',
    ...overrides,
  });

  it('prefers iconUrl over iconKey when iconUrl is set', () => {
    const defs = [makeDef({ id: 'about', iconKey: 'blog', iconUrl: '/custom/direct.png' })];
    const [icon] = resolveDesktopIcons(defs, urls);
    expect(icon.iconSrc).toBe('/custom/direct.png');
  });

  it('resolves via iconKey when iconUrl is absent', () => {
    const defs = [makeDef({ id: 'about', iconKey: 'blog' })];
    const [icon] = resolveDesktopIcons(defs, urls);
    expect(icon.iconSrc).toBe('/icons/blog.png');
  });

  it('falls back to the id as the lookup key when iconKey is absent', () => {
    const defs = [makeDef({ id: 'terminal' })];
    const [icon] = resolveDesktopIcons(defs, urls);
    expect(icon.iconSrc).toBe('/icons/terminal.png');
  });

  it('preserves all original definition fields and adds iconSrc', () => {
    const defs = [
      makeDef({
        id: 'about',
        label: 'About Me',
        windowId: 'about-window',
        defaultOpen: true,
        tooltip: 'Open about',
      }),
    ];
    const [icon] = resolveDesktopIcons(defs, urls);
    expect(icon.id).toBe('about');
    expect(icon.label).toBe('About Me');
    expect(icon.windowId).toBe('about-window');
    expect(icon.defaultOpen).toBe(true);
    expect(icon.tooltip).toBe('Open about');
    expect(icon.iconSrc).toBe('/icons/about.png');
  });

  it('maps multiple definitions independently', () => {
    const defs = [
      makeDef({ id: 'about' }),
      makeDef({ id: 'blog', iconKey: 'blog' }),
      makeDef({ id: 'x', iconUrl: '/direct/x.png' }),
    ];
    const result = resolveDesktopIcons(defs, urls);
    expect(result.map((r) => r.iconSrc)).toEqual([
      '/icons/about.png',
      '/icons/blog.png',
      '/direct/x.png',
    ]);
  });

  it('returns an empty array for empty definitions', () => {
    expect(resolveDesktopIcons([], urls)).toEqual([]);
  });

  it('returns "" for an unresolvable key in production (DEV false)', () => {
    vi.stubEnv('DEV', false);
    const defs = [makeDef({ id: 'nope' })];
    const [icon] = resolveDesktopIcons(defs, urls);
    expect(icon.iconSrc).toBe('');
  });

  it('throws in DEV when a definition resolves to an unknown key', () => {
    vi.stubEnv('DEV', true);
    const defs = [makeDef({ id: 'nope' })];
    expect(() => resolveDesktopIcons(defs, urls)).toThrow(/Unknown icon key "nope"/);
  });
});
