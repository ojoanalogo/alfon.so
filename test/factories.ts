// Shared test fixtures. Import via the `@test/` alias, e.g.
//   import { makeWindowDef, makeAppContext } from '@test/factories';
import { vi } from 'vitest';
import type { AppContext, WindowChromeProps } from '@desktop/wrappers';
import type { BlogPostSummary, WallpaperOption, WindowDef, WindowState } from '@desktop/types';

export function makeWallpaperOption(overrides: Partial<WallpaperOption> = {}): WallpaperOption {
  return {
    id: 'wp-1',
    label: 'Wallpaper 1',
    src: '/wallpapers/wp-1.jpg',
    thumbSrc: '/wallpapers/wp-1-thumb.jpg',
    ...overrides,
  };
}

export function makeWindowDef(overrides: Partial<WindowDef> = {}): WindowDef {
  return {
    id: 'test',
    title: 'Test',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 600,
    initialZ: 10,
    ...overrides,
  };
}

export function makeWindowState(overrides: Partial<WindowState> = {}): WindowState {
  return {
    id: 'test',
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    open: false,
    minimized: false,
    maximized: false,
    zIndex: 10,
    ...overrides,
  };
}

export function makeWindowChromeProps(
  overrides: Partial<WindowChromeProps> = {},
): WindowChromeProps {
  return {
    state: makeWindowState(),
    focused: false,
    minWidth: 400,
    defaultWidth: 600,
    onFocus: vi.fn(),
    onClose: vi.fn(),
    onMinimize: vi.fn(),
    onToggleMaximize: vi.fn(),
    onGeometryChange: vi.fn(),
    ...overrides,
  };
}

export function makeBlogPost(overrides: Partial<BlogPostSummary> = {}): BlogPostSummary {
  return {
    title: 'Test Post',
    slug: 'test-post',
    publishDate: '2024-01-01T00:00:00.000Z',
    description: 'A test post',
    readingTime: '1 min',
    tags: [],
    html: '<p>body</p>',
    ...overrides,
  };
}

/** Minimal AppContext with vi.fn() callbacks; override pieces as needed. */
export function makeAppContext(overrides: Partial<AppContext> = {}): AppContext {
  return {
    posts: [],
    onOpenPost: vi.fn(),
    onOpenApp: vi.fn(),
    onOpenLink: vi.fn(),
    browsers: {
      get: vi.fn(() => ({ url: null }) as never),
      navigate: vi.fn(() => null),
      reload: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      canBack: vi.fn(() => false),
      canForward: vi.fn(() => false),
      hydrateInitial: vi.fn(),
    },
    trash: {
      items: [],
      onOpenFile: vi.fn(),
      onRestore: vi.fn(),
      onRestoreAll: vi.fn(),
      onEmpty: vi.fn(),
    },
    iconUrls: {},
    ...overrides,
  };
}
