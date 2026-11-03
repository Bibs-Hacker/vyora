import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VYORA build config. PWA assets (manifest + service worker) are generated
// by vite-plugin-pwa using the manifest below and an injected Workbox SW.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'VYORA',
        short_name: 'VYORA',
        description: 'A world made for connection.',
        theme_color: '#0b0b14',
        background_color: '#0b0b14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/'),
            handler: 'CacheFirst',
            options: { cacheName: 'vyora-media', expiration: { maxEntries: 120, maxAgeSeconds: 604800 } }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
})
