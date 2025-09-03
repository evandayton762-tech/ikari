// vite.config.js
import { defineConfig } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
import { oxygen } from '@shopify/mini-oxygen/vite';
import { vitePlugin as remix } from '@remix-run/dev';
import path from 'path';

export default defineConfig({
  // Tell Vite where to find your static assets now that they live under public/
  publicDir: 'public',

  plugins: [
    remix({
      // Use Hydrogen’s preset inside the Remix plugin
      presets: [hydrogen.preset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    oxygen(),
  ],

  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },

  build: {
    outDir: 'dist/client',
    assetsInlineLimit: 0,
  },

  ssr: {
    optimizeDeps: {
      include: [
        'use-sync-external-store/shim/with-selector.js',
        'prop-types',
        'react-dom/client',
        'react',
        'scheduler',
        'react-reconciler',
        'react-reconciler/constants',
      ],
    },
  },
});
