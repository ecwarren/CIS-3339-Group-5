import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // absolute asset paths so nested routes like /clientdetails/:id load assets correctly
  base: '/',
  resolve: {
    alias: {
      // cross-platform (no Windows-only path handling)
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})