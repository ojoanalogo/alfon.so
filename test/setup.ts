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

// Unmount React trees and reset jsdom between tests so component renders and
// body-class side effects (e.g. is-window-gesturing) don't leak across cases.
afterEach(() => {
  cleanup();
  document.body.className = '';
});
