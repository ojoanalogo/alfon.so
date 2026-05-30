import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://alfon.so',
  compressHTML: true,
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/happy'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
