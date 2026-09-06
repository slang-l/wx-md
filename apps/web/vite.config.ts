import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyRequest) => {
            // The browser is same-origin with Vite, while the API is one hop behind it.
            // Keep Sec-Fetch-Site for CSRF checks without coupling dev auth to Vite's host.
            proxyRequest.removeHeader('origin');
          });
        },
      },
    },
    watch: {
      ignored: ['**/.tmp-*/**', '**/.tmp-*.zip'],
    },
  },
});
