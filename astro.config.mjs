// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://craftcat.dev',
  integrations: [sitemap({ filter: (page) => !page.includes('/behind-the-tree') })],
  build: {
    // Inline small assets so the site is one round trip on a cold cache.
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  redirects: {
    // The old "personnel file" URL. Keep it working for anything already linked.
    '/personnel': '/resume',
  },
});
