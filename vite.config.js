import { fileURLToPath, URL } from 'node:url'
import plugin404 from 'vite-plugin-404'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/pcee/',
  plugins: [
    vue(),
    vueDevTools(),
    plugin404()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
