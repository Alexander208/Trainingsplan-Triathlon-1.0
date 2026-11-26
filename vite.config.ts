import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // './' = relative Pfade, damit die App auch unter
  // https://<name>.github.io/Trainingsplan-Triathlon-1.0/ funktioniert
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Macht die App installierbar und offline-fähig (Service Worker + Manifest)
    VitePWA({
      registerType: 'autoUpdate', // neue Version wird beim nächsten Öffnen automatisch geladen
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TriPlan – Trainingsplan',
        short_name: 'TriPlan',
        description: 'Trainingspläne für Triathlon, Kraft und Hyrox',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0f17',
        theme_color: '#0b0f17',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles, was die App braucht, wird beim ersten Besuch gespeichert → funktioniert offline
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
