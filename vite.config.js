// Configuración de Vite y de la PWA
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // La app se actualiza sola cuando suben una versión nueva
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // Ficha de la app (manifest)
      manifest: {
        name: 'Not a runner',
        short_name: 'Not a runner',
        description: 'Corre o camina seguro con el calor de Monterrey.',
        lang: 'es-MX',
        start_url: '/',
        scope: '/',
        display: 'standalone', // se abre sin barra del navegador
        orientation: 'portrait',
        theme_color: '#101418', // mismo color que "fondo"
        background_color: '#101418',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})