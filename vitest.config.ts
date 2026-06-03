import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Mirror the tsconfig path aliases (@/* and @desktop/*) so source modules
// resolve the same way under Vitest. More specific aliases are listed first.
const src = fileURLToPath(new URL('./src', import.meta.url));
const desktop = fileURLToPath(new URL('./src/desktop', import.meta.url));
const test = fileURLToPath(new URL('./test', import.meta.url));
const stub = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // Use React's automatic JSX runtime so .tsx tests don't need React in scope.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: [
      // Stub Astro's virtual modules (no Astro pipeline under Vitest). Tests
      // can `vi.mock('astro:content', …)` to inject collection data.
      { find: 'astro:content', replacement: stub('./test/stubs/astro-content.ts') },
      { find: 'astro:assets', replacement: stub('./test/stubs/astro-assets.ts') },
      { find: /^@test\//, replacement: `${test}/` },
      { find: /^@desktop\//, replacement: `${desktop}/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    // jsdom so modules guarded on `typeof window` exercise their browser branch.
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
