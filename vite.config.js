import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/zero-reason/', // GitHub Pages base path
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-v3.js',
        chunkFileNames: 'assets/app-v3.js',
        assetFileNames: 'assets/app-v3.[ext]'
      }
    }
  }
})
