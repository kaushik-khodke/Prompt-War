import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'window',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/coach': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/my-medicines': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/adherence-report': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/due-doses': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/pharmacy': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
