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
    host: "localhost",
    // AIDEV-NOTE: HMR config para evitar erro de WebSocket em porta diferente
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
    },
  },
  build: {
    /**
     * AIDEV-NOTE: Removido manualChunks - Deixar Vite/Rollup decidir automaticamente
     * PRD: melhorias-performance.md - PARTE 5
     *
     * PROBLEMA RESOLVIDO: manualChunks causava dependencia circular entre chunks
     * "Circular chunk: vendor -> react-vendor -> vendor"
     * Resultando em: "Cannot access 'V' before initialization"
     *
     * O Vite/Rollup automaticamente:
     * - Separa chunks por rota (lazy loading em App.tsx)
     * - Agrupa dependencias de forma otimizada sem ciclos
     * - Faz tree-shaking corretamente
     *
     * Vendor splitting manual so e seguro quando nao ha dependencias cruzadas.
     */
    chunkSizeWarningLimit: 500,
  },
}))
