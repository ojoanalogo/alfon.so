import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppDefinition } from '@desktop/wrappers';
import { appIconSrc, appsToIconDefinitions } from './desktopIcons';

/**
 * Build a minimal AppDefinition-shaped object. Only the fields read by
 * appsToIconDefinitions / appIconSrc are meaningful; the rest are stubs to
 * satisfy the structural type.
 */
function makeApp(overrides: Partial<AppDefinition> & { id: string }): AppDefinition {
  return {
    title: overrides.id,
    geometry: { defaultOpen: false } as AppDefinition['geometry'],
    render: () => null,
    ...overrides,
  } as AppDefinition;
}

const urls = { about: '/about.png', blog: '/blog.png' };

describe('appIconSrc', () => {
  it('prefers iconUrl over iconKey', () => {
    const app = makeApp({ id: 'about', iconUrl: '/explicit.png', iconKey: 'about' });
    expect(appIconSrc(app, urls)).toBe('/explicit.png');
  });

  it('resolves iconKey through the urls map when no iconUrl', () => {
    const app = makeApp({ id: 'about', iconKey: 'about' });
    expect(appIconSrc(app, urls)).toBe('/about.png');
  });

  it('returns empty string when neither iconUrl nor iconKey is set', () => {
    const app = makeApp({ id: 'about' });
    expect(appIconSrc(app, urls)).toBe('');
  });

  it('uses iconUrl even when it is an empty string only if defined (nullish coalescing)', () => {
    // iconUrl is undefined -> falls back to iconKey path
    const app = makeApp({ id: 'about', iconUrl: undefined, iconKey: 'blog' });
    expect(appIconSrc(app, urls)).toBe('/blog.png');
  });
});

describe('appsToIconDefinitions', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('filters out apps whose desktopIcon === false', () => {
    const apps = [
      makeApp({ id: 'about' }),
      makeApp({ id: 'blog', desktopIcon: false }),
    ];
    const defs = appsToIconDefinitions(apps);
    expect(defs.map((d) => d.id)).toEqual(['about']);
  });

  it('keeps apps with desktopIcon undefined or an object config', () => {
    const apps = [
      makeApp({ id: 'about' }),
      makeApp({ id: 'blog', desktopIcon: { label: 'My Blog' } }),
    ];
    const defs = appsToIconDefinitions(apps);
    expect(defs.map((d) => d.id).sort()).toEqual(['about', 'blog']);
  });

  it('sorts by DESKTOP_ICON_ORDER regardless of input order', () => {
    // DESKTOP_ICON_ORDER: about, blog, photos, startup, projects, settings, games, notes, terminal
    const apps = [
      makeApp({ id: 'terminal' }),
      makeApp({ id: 'about' }),
      makeApp({ id: 'games' }),
      makeApp({ id: 'blog' }),
    ];
    const defs = appsToIconDefinitions(apps);
    expect(defs.map((d) => d.id)).toEqual(['about', 'blog', 'games', 'terminal']);
  });

  it('maps the expected fields from the app', () => {
    const apps = [
      makeApp({
        id: 'about',
        title: 'about me',
        iconKey: 'about',
        iconUrl: '/about.png',
        geometry: { defaultOpen: true } as AppDefinition['geometry'],
      }),
    ];
    const [def] = appsToIconDefinitions(apps);
    expect(def).toMatchObject({
      id: 'about',
      iconKey: 'about',
      iconUrl: '/about.png',
      windowId: 'about',
      defaultOpen: true,
    });
  });

  it('formats the label (uppercases first letter) from appLabel when no config label', () => {
    const apps = [makeApp({ id: 'about', title: 'about me' })];
    const [def] = appsToIconDefinitions(apps);
    expect(def.label).toBe('About me');
  });

  it('uses appLabel = id when title is a function (non-string)', () => {
    const apps = [makeApp({ id: 'about', title: () => 'Dynamic' })];
    const [def] = appsToIconDefinitions(apps);
    // appLabel returns app.id ('about') -> formatted -> 'About'
    expect(def.label).toBe('About');
  });

  it('prefers desktopIcon.label over appLabel for the label', () => {
    const apps = [
      makeApp({ id: 'about', title: 'about me', desktopIcon: { label: 'custom label' } }),
    ];
    const [def] = appsToIconDefinitions(apps);
    expect(def.label).toBe('Custom label');
  });

  it('derives tooltip from desktopIcon.tooltip when provided', () => {
    const apps = [
      makeApp({ id: 'about', title: 'About', desktopIcon: { tooltip: 'hover text' } }),
    ];
    const [def] = appsToIconDefinitions(apps);
    expect(def.tooltip).toBe('hover text');
  });

  it('falls back tooltip to string title when no config tooltip', () => {
    const apps = [makeApp({ id: 'about', title: 'About Page' })];
    const [def] = appsToIconDefinitions(apps);
    expect(def.tooltip).toBe('About Page');
  });

  it('falls back tooltip to id when title is not a string', () => {
    const apps = [makeApp({ id: 'about', title: () => 'Dynamic' })];
    const [def] = appsToIconDefinitions(apps);
    expect(def.tooltip).toBe('about');
  });

  it('returns an empty list when given no apps', () => {
    expect(appsToIconDefinitions([])).toEqual([]);
  });

  describe('DEV exhaustiveness guard', () => {
    it('throws when an icon-bearing app id is missing from DESKTOP_ICON_ORDER (DEV)', () => {
      // import.meta.env.DEV is true under Vitest by default.
      const apps = [makeApp({ id: 'about' }), makeApp({ id: 'unknown-app' })];
      expect(() => appsToIconDefinitions(apps)).toThrow(/unknown-app/);
      expect(() => appsToIconDefinitions(apps)).toThrow(/DESKTOP_ICON_ORDER/);
    });

    it('does not throw for missing ids when an app with that id has desktopIcon === false', () => {
      const apps = [
        makeApp({ id: 'about' }),
        makeApp({ id: 'unknown-app', desktopIcon: false }),
      ];
      expect(() => appsToIconDefinitions(apps)).not.toThrow();
      expect(appsToIconDefinitions(apps).map((d) => d.id)).toEqual(['about']);
    });

    it('does NOT throw in production even when an id is missing, sorting it last', () => {
      vi.stubEnv('DEV', false);
      const apps = [
        makeApp({ id: 'unknown-app' }),
        makeApp({ id: 'about' }),
      ];
      let defs: ReturnType<typeof appsToIconDefinitions> = [];
      expect(() => {
        defs = appsToIconDefinitions(apps);
      }).not.toThrow();
      // sentinel index sends the unknown id to the end
      expect(defs.map((d) => d.id)).toEqual(['about', 'unknown-app']);
    });
  });
});
