import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom lacks ResizeObserver; components like the window center-layout hook
// construct one on mount. Provide a no-op so renders don't throw.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
}

// jsdom lacks matchMedia; the theme runtime and framer-motion read it. Default
// to "no match" (light, full motion). Individual tests can override.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}

// Unmount React trees and reset jsdom between tests so component renders and
// body-class side effects (e.g. is-window-gesturing) don't leak across cases.
afterEach(() => {
  cleanup();
  document.body.className = '';
});
