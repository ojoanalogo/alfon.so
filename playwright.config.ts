import { defineConfig } from '@playwright/test';

// End-to-end tests run against the real SSR'd app (Astro renders the desktop
// island server-side, then React hydrates) — the only setup that reproduces the
// framer-motion hydration freeze that parked newly-opened windows in the corner.
// jsdom and the no-SSR @vitest/browser suite cannot reproduce it. Run: `pnpm test:e2e`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
