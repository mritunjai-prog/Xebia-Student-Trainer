import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/v1/users': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
        '/api/v1/batches': {
          target: 'http://localhost:8082',
          changeOrigin: true,
        },
        '/api/v1/assessments': {
          target: 'http://localhost:8083',
          changeOrigin: true,
        },
        '/api/v1/questions': {
          target: 'http://localhost:8083',
          changeOrigin: true,
        },
        '/api/v1/submissions': {
          target: 'http://localhost:8083',
          changeOrigin: true,
        },
        '/api/v1/certificates': {
          target: 'http://localhost:8083',
          changeOrigin: true,
        },
      },
    },
  };
});
