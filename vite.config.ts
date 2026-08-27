import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    // GitHub Pages publishes this repository under /SITE-PARA-HOTEIS/.
    // Using an explicit base prevents the production bundle from resolving
    // JS/CSS/assets against the github.io domain root.
    base: '/SITE-PARA-HOTEIS/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(configDir, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
