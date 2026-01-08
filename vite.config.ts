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
        // Manual chunk splitting for better code splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM in separate chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // React Router in separate chunk
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Axios in separate chunk
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            // Markdown libraries in separate chunk
            if (id.includes('react-markdown') || id.includes('remark')) {
              return 'vendor-markdown';
            }
            // Date utilities in separate chunk
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // Zustand in separate chunk
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            // All other node_modules
            return 'vendor';
          }
          // Split large page components into their own chunks
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName) {
              return `page-${pageName}`;
            }
          }
        },
      },
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize chunk size - increased limit since we're splitting chunks
    chunkSizeWarningLimit: 1000,
    // Copy public assets to dist
    copyPublicDir: true,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      'zustand',
    ],
  },
})

