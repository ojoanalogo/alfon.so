import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import type { WallpaperOption } from '../types';

const BOOT_MIN_MS = 400;
const BOOT_EXIT_MS = 120;

function makeWallpaper(overrides: Partial<WallpaperOption> = {}): WallpaperOption {
  return {
    id: 'wp-1',
    label: 'Wallpaper 1',
    src: '/wallpapers/wp-1.jpg',
    thumbSrc: '/wallpapers/wp-1-thumb.jpg',
    ...overrides,
  };
}

interface BootModuleGraph {
  BootOverlay: ComponentType;
  ThemeProvider: ComponentType<{ children: ReactNode }>;
  WallpaperProvider: ComponentType<{ wallpapers: WallpaperOption[]; children: ReactNode }>;
}

/**
 * BootOverlay keeps a module-level `bootFinished` flag that survives remounts,
 * so each test imports a fresh copy of the module to start from the
 * "loading" phase deterministically. The providers must come from the SAME
 * fresh module graph, otherwise BootOverlay's `useWallpaper` reads a different
 * React context than the one rendered here.
 */
async function loadBootModuleGraph(): Promise<BootModuleGraph> {
  vi.resetModules();
  const [boot, theme, wallpaper] = await Promise.all([
    import('./BootOverlay'),
    import('../state/ThemeContext'),
    import('../state/WallpaperContext'),
  ]);
  return {
    BootOverlay: boot.default as ComponentType,
    ThemeProvider: theme.ThemeProvider,
    WallpaperProvider: wallpaper.WallpaperProvider,
  };
}

function renderBoot(graph: BootModuleGraph, wallpapers: WallpaperOption[]) {
  const { BootOverlay, ThemeProvider, WallpaperProvider } = graph;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <WallpaperProvider wallpapers={wallpapers}>{children}</WallpaperProvider>
    </ThemeProvider>
  );
  return render(<BootOverlay />, { wrapper });
}

describe('DesktopBootOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    // ThemeProvider (wrapping WallpaperProvider) calls matchMedia, absent in jsdom.
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the loading overlay while booting', async () => {
    // A stored wallpaper that never finishes loading keeps bootContentReady false.
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, [makeWallpaper()]);

    const overlay = container.querySelector('.desktop-boot-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toContain('Loading');
    expect(overlay?.textContent).toContain('alfon.so');
  });

  it('exposes loading accessibility state while booting', async () => {
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, [makeWallpaper()]);

    const overlay = container.querySelector('.desktop-boot-overlay') as HTMLElement;
    expect(overlay.getAttribute('aria-busy')).toBe('true');
    expect(overlay.getAttribute('aria-live')).toBe('polite');
    expect(overlay.getAttribute('aria-label')).toBe('Loading alfon.so');
    // The spinner is purely decorative.
    expect(
      overlay.querySelector('.desktop-boot-overlay__spinner')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('does not add the exiting class while still loading', async () => {
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, [makeWallpaper()]);

    expect(container.querySelector('.desktop-boot-overlay--exiting')).toBeNull();
  });

  it('transitions to the exiting state after the minimum boot time once content is ready', async () => {
    // No wallpaper + no stored color -> bootContentReady is true immediately.
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, []);

    // Still loading until BOOT_MIN_MS elapses.
    expect(container.querySelector('.desktop-boot-overlay--exiting')).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(BOOT_MIN_MS);
    });

    const overlay = container.querySelector('.desktop-boot-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.className).toContain('desktop-boot-overlay--exiting');
    // While exiting it is no longer busy and drops the loading label.
    expect(overlay.getAttribute('aria-busy')).toBe('false');
    expect(overlay.getAttribute('aria-label')).toBeNull();
  });

  it('unmounts the overlay after the exit animation completes', async () => {
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, []);

    await act(async () => {
      vi.advanceTimersByTime(BOOT_MIN_MS);
    });
    expect(container.querySelector('.desktop-boot-overlay--exiting')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(BOOT_EXIT_MS);
    });

    // phase === 'done' -> component returns null.
    expect(container.querySelector('.desktop-boot-overlay')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on a fresh mount once boot has already finished (survives remount)', async () => {
    // Reuse the SAME module graph so the module-level bootFinished flag persists
    // across the two mounts.
    const graph = await loadBootModuleGraph();

    const first = renderBoot(graph, []);
    // Two advances: the first effect schedules the exit timer only after the
    // loading->exiting render commits.
    await act(async () => {
      vi.advanceTimersByTime(BOOT_MIN_MS);
    });
    await act(async () => {
      vi.advanceTimersByTime(BOOT_EXIT_MS);
    });
    expect(first.container.querySelector('.desktop-boot-overlay')).toBeNull();
    first.unmount();

    // A brand-new mount of the same module should skip the boot screen entirely.
    const second = renderBoot(graph, [makeWallpaper()]);
    expect(second.container.querySelector('.desktop-boot-overlay')).toBeNull();
    expect(second.container.firstChild).toBeNull();
  });

  it('stays on the loading screen until content becomes ready', async () => {
    // Stored wallpaper that never loads -> overlay should remain past BOOT_MIN_MS.
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, [makeWallpaper()]);

    await act(async () => {
      vi.advanceTimersByTime(BOOT_MIN_MS * 5);
    });

    const overlay = container.querySelector('.desktop-boot-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.className).not.toContain('desktop-boot-overlay--exiting');
    expect(overlay.getAttribute('aria-busy')).toBe('true');
  });

  it('exits immediately when content becomes ready after the minimum boot time', async () => {
    // Stored wallpaper keeps bootContentReady false until the image loads.
    localStorage.setItem('devfolio.wallpaper', 'wp-1');
    const instances: Array<{ onload: (() => void) | null }> = [];
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src = '';
      constructor() {
        instances.push(this);
      }
      set src(value: string) {
        this._src = value;
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', FakeImage);

    const graph = await loadBootModuleGraph();
    const { container } = renderBoot(graph, [makeWallpaper()]);

    // Past the minimum boot window but content still loading → still on screen.
    await act(async () => {
      vi.advanceTimersByTime(BOOT_MIN_MS * 2);
    });
    expect(container.querySelector('.desktop-boot-overlay--exiting')).toBeNull();

    // Content finishes late → remaining clamps to 0, so the exit fires at once.
    await act(async () => {
      instances[instances.length - 1]?.onload?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(container.querySelector('.desktop-boot-overlay')?.className).toContain(
      'desktop-boot-overlay--exiting',
    );
  });
});
