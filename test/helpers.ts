// Shared test helpers. Import via the `@test/` alias, e.g.
//   import { setViewport, flushFrame } from '@test/helpers';
import { vi } from 'vitest';

/** Pin jsdom's reported viewport (defaults to 1024x768). */
export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true });
}

/** Pin only the viewport width, leaving the current height. */
export function setViewportWidth(width: number) {
  setViewport(width, window.innerHeight);
}

/** Resolve after one animation frame (lets a queued rAF callback run). */
export const flushFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Resolve after two animation frames (the double-rAF settle pattern). */
export const flush2Frames = () => flushFrame().then(flushFrame);

/**
 * Stub `window.matchMedia` with `vi.fn()`-backed listeners so tests can assert
 * `addEventListener` was wired (the global no-op in test/setup.ts can't be
 * spied on). Returns the shared media-query-list mock. Cleared by the global
 * `vi.unstubAllGlobals()` / per-file teardown.
 */
export function stubMatchMedia(matches = false) {
  const mql = {
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ ...mql, media: query })),
  );
  return mql;
}
