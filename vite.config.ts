import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // AIDEV-NOTE: Gera relatorio visual do bundle em dist/stats.html
    // PRD: melhorias-performance.md - PARTE 5, Fase 4
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 8080,
    host: "::",
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * AIDEV-NOTE: Vendor Splitting Strategy (CONSERVADORA)
         * PRD: melhorias-performance.md - PARTE 5, Fase 1
         *
         * IMPORTANTE: Versao anterior causava erro de inicializacao circular
         * "Cannot access 'M' before initialization"
         *
         * Esta versao agrupa apenas bibliotecas que NAO dependem umas das outras:
         * - react-vendor: React + React DOM + Router (base de tudo)
         * - vendor: Todas as outras dependencias juntas
         *
         * O code splitting por rota (lazy loading) ja separa os chunks de forma
         * otimizada pelo Vite/Rollup automaticamente.
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React Core - Agrupar React e suas dependencias diretas
            // Isso evita problemas de inicializacao circular
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/') ||
              id.includes('/@remix-run/')
            ) {
              return 'react-vendor';
            }

            // Todas as outras dependencias vao para vendor unico
            // Isso e mais seguro e evita problemas de ordem de carregamento
            return 'vendor';
          }
        },
      },
    },
    // Aumentar warning limit para chunks maiores esperados
    chunkSizeWarningLimit: 500,
  },
}))
