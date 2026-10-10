import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the backend in dev — avoids CORS issues
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime in its own cached chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // QR scanning library — largest dep, cached independently
          'vendor-qrcode': ['html5-qrcode'],
          // Axios in its own small chunk
          'vendor-axios': ['axios'],
        },
      },
    },
  },
});
