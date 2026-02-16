import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: './', // Root is where index.html stays for now
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Proxima 8',
        short_name: 'Proxima 8',
        description: 'Identify the hidden neural pattern in this pure deduction logic challenge.',
        theme_color: '#4dabf7',
        background_color: '#0b0e14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/index.html',
        icons: [
          {
            src: 'assets/icon_192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'assets/icon_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'assets/icon_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
