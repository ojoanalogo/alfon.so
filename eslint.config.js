import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const scriptFiles = ['src/**/*.{js,mjs,cjs,jsx,ts,tsx}'];
const reactFiles = ['src/**/*.{jsx,tsx}'];

export default defineConfig(
  // Ignores — build output, Astro generated types, and env.d.ts (not hand-written).
  {
    ignores: ['dist/', '.astro/', 'src/env.d.ts'],
  },

  // JavaScript — base recommended rules; also applies to .astro frontmatter.
  js.configs.recommended,

  // TypeScript — script files only; Astro frontmatter is handled below.
  {
    files: scriptFiles,
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Allow intentionally-unused names prefixed with `_` (e.g. typed-but-ignored
      // callback args like `(_ctx) => …`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // React — JSX/TSX islands only (recommended, jsx-runtime, hooks, r3f prop exceptions).
  {
    files: reactFiles,
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: reactFiles,
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: reactFiles,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Accessibility for the React island. The Astro a11y config below registers
  // the `jsx-a11y` plugin globally but only lints .astro templates; reapply the
  // recommended rules to .tsx so the ~18-app desktop is covered too. Rules only
  // (no `plugins` key) to avoid redefining the plugin Astro already registered.
  {
    files: reactFiles,
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },

  // Astro — recommended rules plus Astro-aware jsx-a11y.
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  // Astro frontmatter — bind the TS parser explicitly. flat/recommended leaves
  // parserOptions.parser unset; auto-detect works from the CLI but can fail in
  // the editor (cwd-sensitive), which then parses frontmatter as JS and errors
  // on TypeScript syntax like `import type {`.
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },

  // Prettier — turn off ESLint stylistic rules that conflict with Prettier.
  // Must stay last so it wins over earlier configs.
  prettier,
);
