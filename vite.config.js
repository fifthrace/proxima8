import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  const isProd = command === 'build';
  
  return {
    // Production (proxima8.bajo.io) uses root base.
    // Development (LAN/Tailscale proxy) uses subpath base.
    base: isProd ? '/' : '/proxima8/',
    root: './',
    publicDir: 'public',
    build: {
      outDir: 'docs',
      emptyOutDir: true,
    },
    server: {
      allowedHosts: ['baxmain.tail929299.ts.net', 'localhost', '127.0.0.1', '192.168.50.76']
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
  };
});
