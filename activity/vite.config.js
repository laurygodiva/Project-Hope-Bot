import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En desarrollo local, reenvía /api al backend del bot.
      // Cuando se ejecute embebida en Discord, las peticiones pasan
      // por el proxy de Discord (URL Mapping configurado en el Developer Portal).
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
