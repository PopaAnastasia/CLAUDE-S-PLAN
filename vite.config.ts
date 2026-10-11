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
      includeAssets: ['apple-touch-icon.png', 'favicon.png', 'intro.mp4', 'intro.webm'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,mp4,webm}'],
      },
      manifest: {
        name: 'Shake',
        short_name: 'Shake',
        description: 'Workouts, calories and steps in one simple tracker',
        display: 'standalone',
        start_url: '/',
        background_color: '#523acb',
        theme_color: '#523acb',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
