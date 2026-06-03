import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees and reset jsdom between tests so component renders and
// body-class side effects (e.g. is-window-gesturing) don't leak across cases.
afterEach(() => {
  cleanup();
  document.body.className = '';
});
