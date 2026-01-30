import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cornell-notes/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@cornell-notes/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@cornell-notes/types': path.resolve(__dirname, '../../packages/types/src'),
      '@cornell-notes/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
