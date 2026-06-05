import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { baseConfig } from './test/vitest.base';

// Separate Vitest project for real-browser tests (Playwright/Chromium). Kept out
// of the default `pnpm test` (jsdom) so CI stays jsdom-only; run via
// `pnpm test:browser`. Shares aliases/esbuild via baseConfig.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['test/browser/**/*.browser.test.{ts,tsx}'],
      // NOTE: `setupFiles: ['./test/setup.ts']` is intentionally omitted — the jsdom
      // polyfills (ResizeObserver, matchMedia) are native in a real browser and the
      // render adapter handles its own cleanup. Do not copy the jsdom setup here.
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        // Desktop viewport — the windowing logic is desktop-only below 40rem, so
        // these tests must run wide enough to exercise centered/near-center placement.
        viewport: { width: 1280, height: 800 },
        instances: [{ browser: 'chromium', viewport: { width: 1280, height: 800 } }],
      },
    },
  }),
);
