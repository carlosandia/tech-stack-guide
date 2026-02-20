/**
 * AIDEV-NOTE: Barrel exports MINIMOS para modulo de Contatos
 * PRD: melhorias-performance.md - PARTE 5, Fase 2
 *
 * ContatosPage e carregada via lazy loading direto em App.tsx
 * Aqui exportamos apenas o que e usado POR OUTROS MODULOS
 *
 * REGRA: Nao exportar componentes aqui - importar diretamente do arquivo
 * Isso permite melhor tree-shaking e chunks menores
 */

// Hooks compartilhados (usados por negocios, emails)
export { useContatos, useContato, useCriarContato, useAtualizarContato } from './hooks/useContatos'
export { useSegmentos, useSegmentarLote } from './hooks/useSegmentos'
export { useCamposConfig } from './hooks/useCamposConfig'

// Types compartilhados
export type { Contato, TipoContato, ListarContatosParams } from './services/contatos.api'

// API service (para chamadas diretas)
export { contatosApi } from './services/contatos.api'

// Schemas compartilhados
export { PorteOptions } from './schemas/contatos.schema'
