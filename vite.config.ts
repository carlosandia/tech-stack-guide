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
         * AIDEV-NOTE: Vendor Splitting Strategy
         * PRD: melhorias-performance.md - PARTE 5, Fase 1
         *
         * Separa dependencias por frequencia de atualizacao:
         * - react-vendor: Core React (raramente muda) - cache longo
         * - ui-vendor: Componentes UI (muda pouco)
         * - utils-vendor: Utilitarios (muda moderadamente)
         * - chart-vendor: Graficos (so modulos especificos usam)
         * - editor-vendor: Rich text (so emails/formularios usam)
         * - vendor: Resto (muda frequentemente)
         */
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React Core - Raramente muda (cache ~6 meses)
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            // UI Components - Muda pouco (cache ~1 mes)
            if (
              id.includes('@radix-ui') ||
              id.includes('lucide-react') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('cmdk') ||
              id.includes('sonner')
            ) {
              return 'ui-vendor';
            }

            // Utilitarios - Muda moderadamente
            if (
              id.includes('date-fns') ||
              id.includes('/zod/') ||
              id.includes('react-hook-form') ||
              id.includes('@hookform')
            ) {
              return 'utils-vendor';
            }

            // Charts - So Dashboard/Relatorios usam
            if (
              id.includes('recharts') ||
              id.includes('/d3')
            ) {
              return 'chart-vendor';
            }

            // Rich Text Editor - So Emails/Formularios usam
            if (
              id.includes('tiptap') ||
              id.includes('prosemirror') ||
              id.includes('@tiptap')
            ) {
              return 'editor-vendor';
            }

            // DnD - So Kanban/Formularios usam
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }

            // TanStack Query - Usado em todo app
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }

            // Supabase Client
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }

            // Resto vai para vendor generico
            return 'vendor';
          }
        },
      },
    },
    // Aumentar warning limit para chunks maiores esperados
    chunkSizeWarningLimit: 300,
  },
}))
