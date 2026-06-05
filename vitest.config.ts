import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './test/vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // jsdom so modules guarded on `typeof window` exercise their browser branch.
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }),
);
