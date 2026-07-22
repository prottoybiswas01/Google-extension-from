import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest';
import path from 'path';
import fs from 'fs';

function fixCrxServiceWorker() {
  return {
    name: 'fix-crx-service-worker',
    closeBundle() {
      const swLoaderPath = path.resolve(__dirname, 'dist/service-worker-loader.js');
      if (fs.existsSync(swLoaderPath)) {
        let content = fs.readFileSync(swLoaderPath, 'utf-8');
        content = content.replace(/import\s+['"](.+?)['"];?/g, "importScripts('$1');");
        fs.writeFileSync(swLoaderPath, content, 'utf-8');
      }

      const manifestPath = path.resolve(__dirname, 'dist/manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifestObj = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (manifestObj.background) {
            delete manifestObj.background.type;
            fs.writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error('Failed fixing manifest background type:', e);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    fixCrxServiceWorker(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
