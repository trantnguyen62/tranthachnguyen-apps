import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5186,
    host: '0.0.0.0',
    allowedHosts: ['passportphoto.tranthachnguyen.com', 'localhost'],
    proxy: {
      '/api': { target: 'http://localhost:5185', changeOrigin: true }
    }
  },
  plugins: [react()],
  build: {
    target: 'es2020',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          'bg-removal': ['@imgly/background-removal'],
        },
      },
    },
  },
});




