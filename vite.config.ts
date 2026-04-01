import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
      $types: resolve(__dirname, 'src/types'),
      $features: resolve(__dirname, 'src/features'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
