import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ambria-hub/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Ambria Hub',
        short_name: 'Ambria',
        theme_color: '#F7F6F3',
        background_color: '#F7F6F3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/ambria-hub/',
        scope: '/ambria-hub/',
        description: 'Social media operations dashboard for Ambria Events',
        icons: [
          { src: '/ambria-hub/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/ambria-hub/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
  ],
})
