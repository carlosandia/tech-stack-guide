/**
 * AIDEV-NOTE: Barrel exports MINIMOS para modulo de Negocios
 * PRD: melhorias-performance.md - PARTE 5, Fase 2
 *
 * Pages sao carregadas via lazy loading direto em App.tsx
 * Aqui exportamos apenas o que e usado POR OUTROS MODULOS
 *
 * REGRA: Nao exportar componentes aqui - importar diretamente do arquivo
 * Isso permite melhor tree-shaking e chunks menores
 */

// Hooks compartilhados (usados por contatos, conversas, configuracoes)
export { useFunis, useFunilComEtapas } from './hooks/useFunis'
export { useBloqueadosPreOp, useDesbloquearPreOp } from './hooks/usePreOportunidades'

// Types compartilhados
export type { Oportunidade, Funil, EtapaFunil, FunilComEtapas } from './services/negocios.api'

// API service (para chamadas diretas)
export { negociosApi } from './services/negocios.api'
