import { defineConfig } from '@playwright/test';

// e2e against the PRODUCTION build (astro build + astro preview) — serves the
// statically-rendered SSR HTML the way GitHub Pages does, which is the closest
// reproduction of the framer-motion hydration behavior. Runs on a separate port
// (4322) so it never collides with a running `pnpm dev` on 4321. Run via
// `pnpm test:e2e:prod`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4322',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
