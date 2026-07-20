import { describe, it, expect } from 'vitest';
import type { AppDefinition } from '@desktop/wrappers';
import type { AppGeometry } from '@desktop/types';
import {
  appsToIconDefinitions,
  desktopAppLabel,
  desktopAppLabels,
  desktopVisibleApps,
} from './appIcons';
import { APPS } from './registry';

function makeApp(overrides: Partial<AppDefinition> = {}): AppDefinition {
  const geometry: AppGeometry = { defaultWidth: 600 };
  return {
    id: 'test',
    title: 'test',
    geometry,
    render: () => null,
    ...overrides,
  };
}

describe('desktopVisibleApps', () => {
  it('excludes apps with desktopIcon: false', () => {
    const apps = [
      makeApp({ id: 'about', desktopIcon: { label: 'about' } }),
      makeApp({ id: 'hidden', desktopIcon: false }),
    ];
    expect(desktopVisibleApps(apps).map((a) => a.id)).toEqual(['about']);
  });

  it('respects availableWhen using posts', () => {
    const blog = makeApp({
      id: 'blog',
      desktopIcon: { label: 'blog' },
      availableWhen: (ctx) => ctx.posts.length > 0,
    });
    const about = makeApp({ id: 'about', desktopIcon: { label: 'about' } });
    const apps = [blog, about];

    expect(desktopVisibleApps(apps, { posts: [] }).map((a) => a.id)).toEqual(['about']);
    expect(
      desktopVisibleApps(apps, {
        posts: [{ title: 't', slug: 's', publishDate: '', html: '' }],
      }).map((a) => a.id),
    ).toEqual(['about', 'blog']);
  });

  it('sorts by DESKTOP_ICON_ORDER', () => {
    const apps = [
      makeApp({ id: 'terminal', desktopIcon: { label: 'terminal' } }),
      makeApp({ id: 'about', desktopIcon: { label: 'about' } }),
      makeApp({ id: 'blog', desktopIcon: { label: 'blog' } }),
    ];
    expect(desktopAppLabels(apps)).toEqual(['about', 'blog', 'terminal']);
  });
});

describe('desktop parity with icon definitions', () => {
  it('desktopIconApps order matches appsToIconDefinitions ids', () => {
    const posts = [{ title: 'Post', slug: 'p', publishDate: '', html: '' }];
    const visible = desktopVisibleApps(APPS, { posts });
    const defs = appsToIconDefinitions(visible);
    expect(defs.map((d) => d.id)).toEqual(visible.map((a) => a.id));
    expect(desktopAppLabels(APPS, { posts })).toEqual(visible.map(desktopAppLabel));
  });
});

describe('desktopAppLabel', () => {
  it('prefers desktopIcon.label over title', () => {
    expect(desktopAppLabel(makeApp({ title: 'long title', desktopIcon: { label: 'short' } }))).toBe(
      'short',
    );
  });

  it('falls back to id when title is a function', () => {
    expect(
      desktopAppLabel(
        makeApp({
          id: 'browser',
          title: () => 'dynamic',
          desktopIcon: { label: 'browser' },
        }),
      ),
    ).toBe('browser');
  });
});
