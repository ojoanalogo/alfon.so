import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';

// Separate Vitest project for real-browser tests (Playwright/Chromium). Kept out
// of the default `pnpm test` (jsdom) so CI stays jsdom-only; run via
// `pnpm test:browser`. Mirrors vitest.config.ts aliases/esbuild.
const src = fileURLToPath(new URL('./src', import.meta.url));
const desktop = fileURLToPath(new URL('./src/desktop', import.meta.url));
const test = fileURLToPath(new URL('./test', import.meta.url));
const stub = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: [
      { find: 'astro:content', replacement: stub('./test/stubs/astro-content.ts') },
      { find: 'astro:assets', replacement: stub('./test/stubs/astro-assets.ts') },
      { find: /^@test\//, replacement: `${test}/` },
      { find: /^@desktop\//, replacement: `${desktop}/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    include: ['test/browser/**/*.browser.test.{ts,tsx}'],
    // NOTE: `setupFiles: ['./test/setup.ts']` is intentionally omitted — the jsdom
    // polyfills (ResizeObserver, matchMedia) are native in a real browser and the
    // render adapter handles its own cleanup. Do not copy the jsdom setup here.
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
