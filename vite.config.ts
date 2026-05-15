import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['artist-logo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ARTIST',
        short_name: 'ARTIST',
        description: 'מערכת CRM חכמה לניהול אומנים חתומים ולא חתומים',
        lang: 'he-IL',
        dir: 'rtl',
        theme_color: '#f4f7f9',
        background_color: '#f4f7f9',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['business', 'productivity'],
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
