import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react/')) return 'react'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'JUSIC',
        short_name: 'JUSIC',
        description: 'מערכת CRM פרימיום לניהול אומנים חתומים ולא חתומים',
        lang: 'he-IL',
        dir: 'rtl',
        theme_color: '#f5f3ff',
        background_color: '#f5f3ff',
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
