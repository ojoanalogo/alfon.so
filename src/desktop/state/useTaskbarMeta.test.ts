import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskbarMeta } from './useTaskbarMeta';
import type { AppDefinition } from '@desktop/wrappers';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';

/** Build a minimal valid AppDefinition; only the fields the hook reads matter. */
function makeApp(overrides: Partial<AppDefinition> = {}): AppDefinition {
  return {
    id: 'app',
    title: 'app',
    geometry: { defaultOpen: false } as never,
    render: () => null,
    ...overrides,
  } as AppDefinition;
}

describe('useTaskbarMeta', () => {
  it('maps a simple string-title app to a WindowMeta keyed by id', () => {
    const apps = [makeApp({ id: 'notes', title: 'notes', iconUrl: '/notes.png' })];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    expect(Object.keys(result.current)).toEqual(['notes']);
    expect(result.current.notes).toEqual({
      iconSrc: '/notes.png',
      label: 'Notes',
      tooltip: 'Notes',
    });
  });

  it('capitalizes the first letter of the label via formatWindowTitle', () => {
    const apps = [makeApp({ id: 'about', title: 'about me', iconUrl: '/x.png' })];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    expect(result.current.about.label).toBe('About me');
  });

  it('falls back to the app id when the title is a function (not a string)', () => {
    const apps = [
      makeApp({ id: 'browser', title: () => 'dynamic title', iconUrl: '/b.png' }),
    ];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    // appLabel-style fallback: non-string title -> use id, then capitalize.
    expect(result.current.browser.label).toBe('Browser');
  });

  it('uses taskbarTooltip when provided, otherwise defaults to the label', () => {
    const apps = [
      makeApp({ id: 'a', title: 'alpha', iconUrl: '/a.png', taskbarTooltip: 'Custom Tip' }),
      makeApp({ id: 'b', title: 'bravo', iconUrl: '/b.png' }),
    ];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    expect(result.current.a.tooltip).toBe('Custom Tip');
    expect(result.current.b.tooltip).toBe(result.current.b.label);
    expect(result.current.b.tooltip).toBe('Bravo');
  });

  it('prefers iconUrl over iconKey for iconSrc', () => {
    const urls: DesktopIconUrls = { notes: '/from-key.png' };
    const apps = [
      makeApp({ id: 'notes', title: 'notes', iconUrl: '/from-url.png', iconKey: 'notes' as never }),
    ];
    const { result } = renderHook(() => useTaskbarMeta(apps, urls));

    expect(result.current.notes.iconSrc).toBe('/from-url.png');
  });

  it('resolves iconSrc from iconKey via the url map when iconUrl is absent', () => {
    const urls: DesktopIconUrls = { notes: '/resolved.png' };
    const apps = [makeApp({ id: 'notes', title: 'notes', iconKey: 'notes' as never })];
    const { result } = renderHook(() => useTaskbarMeta(apps, urls));

    expect(result.current.notes.iconSrc).toBe('/resolved.png');
  });

  it('produces an empty iconSrc when neither iconUrl nor iconKey is set', () => {
    const apps = [makeApp({ id: 'bare', title: 'bare' })];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    expect(result.current.bare.iconSrc).toBe('');
  });

  it('overrides the label with the bare trash-junk filename for junk apps', () => {
    // happy is wired to a TRASH_JUNK entry with appId set.
    const apps = [makeApp({ id: 'happy', title: 'A Wholesome Video', iconUrl: '/v.png' })];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    // Raw junk name is 'no_abrir.mp4'; formatWindowTitle capitalizes the first
    // LETTER it finds.
    expect(result.current.happy.label).toBe('No_abrir.mp4');
    // tooltip defaults to the (junk-overridden) label.
    expect(result.current.happy.tooltip).toBe('No_abrir.mp4');
  });

  it('does NOT apply the trash-junk override to non-junk app ids', () => {
    const apps = [makeApp({ id: 'cv', title: 'My CV', iconUrl: '/c.png' })];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    // 'cv' is a TRASH_JUNK entry but has no appId, so it is not in the override map.
    expect(result.current.cv.label).toBe('My CV');
  });

  it('builds meta for multiple apps and keys each by its id', () => {
    const apps = [
      makeApp({ id: 'one', title: 'one', iconUrl: '/1.png' }),
      makeApp({ id: 'two', title: 'two', iconUrl: '/2.png' }),
      makeApp({ id: 'three', title: 'three', iconUrl: '/3.png' }),
    ];
    const { result } = renderHook(() => useTaskbarMeta(apps, {}));

    expect(Object.keys(result.current).sort()).toEqual(['one', 'three', 'two']);
    expect(result.current.two.iconSrc).toBe('/2.png');
  });

  it('returns an empty record for no apps', () => {
    const { result } = renderHook(() => useTaskbarMeta([], {}));
    expect(result.current).toEqual({});
  });

  it('memoizes: same inputs return a stable reference, new inputs recompute', () => {
    const apps = [makeApp({ id: 'a', title: 'a', iconUrl: '/a.png' })];
    const urls: DesktopIconUrls = {};

    const { result, rerender } = renderHook(
      ({ apps, urls }) => useTaskbarMeta(apps, urls),
      { initialProps: { apps, urls } },
    );
    const first = result.current;

    rerender({ apps, urls });
    expect(result.current).toBe(first);

    const apps2 = [makeApp({ id: 'b', title: 'b', iconUrl: '/b.png' })];
    rerender({ apps: apps2, urls });
    expect(result.current).not.toBe(first);
    expect(Object.keys(result.current)).toEqual(['b']);
  });

  it('throws in DEV when an iconKey is missing from the url map (resolveIconUrl guard)', () => {
    const apps = [makeApp({ id: 'x', title: 'x', iconKey: 'missing-key' as never })];
    expect(() => renderHook(() => useTaskbarMeta(apps, {}))).toThrow(/Unknown icon key/);
  });

  it('in production, an unknown iconKey yields an empty iconSrc instead of throwing', () => {
    vi.stubEnv('DEV', false);
    try {
      const apps = [makeApp({ id: 'x', title: 'x', iconKey: 'missing-key' as never })];
      const { result } = renderHook(() => useTaskbarMeta(apps, {}));
      expect(result.current.x.iconSrc).toBe('');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
