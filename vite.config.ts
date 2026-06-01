import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/nvidia': {
            target: 'https://integrate.api.nvidia.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        exclude: ['puppeteer', 'puppeteer-core', 'fluent-ffmpeg', '@puppeteer/browsers', 'chromium-bidi'],
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        rollupOptions: {
          external: [
            'fs',
            'path',
            'os',
            'child_process',
            'util',
            'stream',
            'events',
            'puppeteer',
            'puppeteer-core',
            'fluent-ffmpeg',
            '@puppeteer/browsers',
          ],
        },
      },
    };
});
