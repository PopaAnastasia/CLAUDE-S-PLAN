import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Daily Fit',
        short_name: 'Daily Fit',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: []
      }
    })
  ]
})