/**
 * AIDEV-NOTE: Configuracoes padrao de cache por tipo de dado
 * Usar essas constantes em vez de valores hardcoded nos hooks
 * PRD: melhorias-performance.md - Fase 2
 *
 * Categorias de dados:
 * - REAL_TIME: Dados que mudam frequentemente (conversas ativas, kanban drag)
 * - LIST: Dados de listagem (contatos, tarefas, oportunidades)
 * - CONFIG: Dados de configuracao (funis, campos custom, produtos)
 * - HISTORICAL: Dados historicos (logs, audit, historico email)
 * - STATIC: Dados quase estaticos (organizacao, perfil, planos)
 */

export const QUERY_STALE_TIMES = {
  /**
   * Dados que mudam frequentemente
   * Usado em: conversas ativas, posicao de cards no kanban
   */
  REAL_TIME: 30 * 1000, // 30 segundos

  /**
   * Dados de listagem padrao
   * Usado em: lista de contatos, tarefas, oportunidades
   */
  LIST: 60 * 1000, // 1 minuto

  /**
   * Dados de configuracao do tenant
   * Usado em: funis, etapas, campos customizados, produtos
   */
  CONFIG: 5 * 60 * 1000, // 5 minutos

  /**
   * Dados historicos que raramente mudam
   * Usado em: logs, audit trail, historico de emails
   */
  HISTORICAL: 10 * 60 * 1000, // 10 minutos

  /**
   * Dados quase estaticos
   * Usado em: organizacao, perfil do usuario, planos
   */
  STATIC: 30 * 60 * 1000, // 30 minutos
} as const

/**
 * Tempos de garbage collection do cache
 * gcTime define quanto tempo os dados ficam em cache apos ficarem inativos
 */
export const QUERY_GC_TIMES = {
  /**
   * Padrao para maioria das queries
   */
  DEFAULT: 5 * 60 * 1000, // 5 minutos

  /**
   * Para dados grandes ou que demoram para buscar
   * Usado em: exportacoes, relatorios, dashboards
   */
  EXTENDED: 30 * 60 * 1000, // 30 minutos
} as const

/**
 * Configuracao padrao para queries de listagem
 * Combina staleTime + gcTime + outras opcoes comuns
 */
export const DEFAULT_LIST_QUERY_OPTIONS = {
  staleTime: QUERY_STALE_TIMES.LIST,
  gcTime: QUERY_GC_TIMES.DEFAULT,
  refetchOnWindowFocus: false,
  retry: 1,
} as const

/**
 * Configuracao padrao para queries de configuracao
 */
export const DEFAULT_CONFIG_QUERY_OPTIONS = {
  staleTime: QUERY_STALE_TIMES.CONFIG,
  gcTime: QUERY_GC_TIMES.DEFAULT,
  refetchOnWindowFocus: false,
  retry: 2,
} as const

/**
 * Configuracao padrao para queries em tempo real
 * Use apenas quando realmente precisar de dados fresh
 */
export const DEFAULT_REALTIME_QUERY_OPTIONS = {
  staleTime: QUERY_STALE_TIMES.REAL_TIME,
  gcTime: QUERY_GC_TIMES.DEFAULT,
  refetchOnWindowFocus: false,
  retry: 1,
} as const

// Tipos derivados para uso em TypeScript
export type QueryStaleTimeKey = keyof typeof QUERY_STALE_TIMES
export type QueryGcTimeKey = keyof typeof QUERY_GC_TIMES
