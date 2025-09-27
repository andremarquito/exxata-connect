import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'react-hot-toast',
      '@supabase/supabase-js',
      'lucide-react',
      'xlsx',
    ],
    exclude: ['react-grid-layout'],
    force: true,
  },
  define: {
    global: 'globalThis',
  },
  // Evita que o cache otimizado fique dentro do Dropbox (possíveis locks)
  cacheDir: path.resolve(os.tmpdir(), 'vite-cache-connect'),
  // Build otimizado especificamente para Netlify
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Nomes de arquivo mais simples
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Chunks mais simples para evitar conflitos
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-components': ['lucide-react', 'react-hot-toast'],
          'radix-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label']
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
    // Assegurar que assets sejam copiados corretamente
    assetsDir: 'assets',
    copyPublicDir: true
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    // Watch mais estável em Windows/Dropbox
    watch: {
      usePolling: true,
      interval: 120,
    },
  },
});
