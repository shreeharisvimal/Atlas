import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8765',
        changeOrigin: true,
      },
    },
  },
  // Production base path - set VITE_BASE_PATH in .env if needed
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    // Enable asset caching
    rollupOptions: {
      output: {
        // Add content hash to filenames for better caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep logos and static assets in root for easier access
          if (assetInfo.name && (assetInfo.name.includes('logo') || assetInfo.name.endsWith('.svg'))) {
            return 'assets/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Copy public assets to dist
    copyPublicDir: true,
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

