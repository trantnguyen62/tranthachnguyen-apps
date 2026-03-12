import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5187,
    host: true,
    proxy: {
      // Dev backend must run on 5188 (PORT=5188 npm start) to avoid conflict
      '/api': {
        target: 'http://localhost:5188',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        }
      }
    }
  }
})
