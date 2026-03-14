import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'localhost',
        'linguaflow.tranthachnguyen.com',
        'tranthachnguyen.com',
        'www.tranthachnguyen.com'
      ],
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(self), camera=()',
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "connect-src 'self' ws://localhost:3001 wss://linguaflow.tranthachnguyen.com ws://linguaflow.tranthachnguyen.com http://localhost:3002",
          "media-src 'self' blob:",
          "img-src 'self' data:",
          "worker-src 'self' blob:",
          "frame-ancestors 'none'",
        ].join('; ')
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            genai: ['@google/genai'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

