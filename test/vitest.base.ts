import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Shared Vitest config for both the jsdom (vitest.config.ts) and browser
// (vitest.browser.config.ts) projects: tsconfig path aliases (@/* @desktop/*
// @test/*), Astro virtual-module stubs, and the automatic JSX runtime. Merge it
// with `mergeConfig(baseConfig, defineConfig({ test: { … } }))`.
const src = fileURLToPath(new URL('../src', import.meta.url));
const desktop = fileURLToPath(new URL('../src/desktop', import.meta.url));
const test = fileURLToPath(new URL('.', import.meta.url));
const stub = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export const baseConfig = defineConfig({
  // Vite 8 transforms with Oxc and ignores `esbuild` when `oxc` is set. Astro's
  // tsconfig keeps `jsx: preserve`, which leaves JSX in the module graph and
  // breaks Vitest's import analysis. Compile JSX here instead.
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
    },
  },
  resolve: {
    alias: [
      // Stub Astro's virtual modules (no Astro pipeline under Vitest). Tests
      // can `vi.mock('astro:content', …)` to inject collection data.
      { find: 'astro:content', replacement: stub('./stubs/astro-content.ts') },
      { find: 'astro:assets', replacement: stub('./stubs/astro-assets.ts') },
      { find: /^@test\//, replacement: `${test}/` },
      { find: /^@desktop\//, replacement: `${desktop}/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
});
