/**
 * AIDEV-NOTE: Barrel exports MINIMOS para modulo de Configuracoes
 * PRD: melhorias-performance.md - PARTE 5, Fase 2
 *
 * Pages sao carregadas via lazy loading direto em App.tsx
 * Aqui exportamos apenas o que e usado POR OUTROS MODULOS
 *
 * REGRA: Nao exportar componentes aqui - importar diretamente do arquivo
 * Isso permite melhor tree-shaking e chunks menores
 */

// Hooks compartilhados (usados por outros modulos)
export { useUsuarios } from './hooks/useEquipe'
export { useCampos, useTodosCampos, useCriarCampo } from './hooks/useCampos'
export { useConfigCard } from './hooks/useRegras'
export { useMetasEmpresa, useMetasIndividuais, useRanking } from './hooks/useMetas'
export { useOrigens, useOrigensAtivas, getOrigemLabel } from './hooks/useOrigens'

// Types compartilhados
export type {
  CampoCustomizado,
  Entidade,
  MetaComProgresso,
  RankingItem,
  CriarCampoPayload,
  Usuario,
} from './services/configuracoes.api'

// Schemas compartilhados
export { tipoCampoOptions } from './schemas/campos.schema'
export { getMetricaLabel, getMetricaUnidade } from './schemas/metas.schema'
