/**
 * AIDEV-NOTE: Preload utility para chunks de rotas
 * PRD: melhorias-performance.md - PARTE 5, Fase 3
 *
 * Carrega chunks em background durante idle time do browser
 * Isso melhora a navegacao subsequente sem impactar a performance inicial
 */

// Cache de chunks ja precarregados
const preloadedChunks = new Set<string>()

/**
 * Precarrega um chunk de rota especifico
 * Usa requestIdleCallback para nao impactar interacoes do usuario
 */
export function preloadRoute(importFn: () => Promise<unknown>) {
  const key = importFn.toString()

  if (preloadedChunks.has(key)) return

  // Usar requestIdleCallback para nao impactar interacoes
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        importFn().catch(() => {
          // Silenciar erros de preload - nao e critico
        })
        preloadedChunks.add(key)
      },
      { timeout: 5000 } // Timeout de 5s para garantir execucao
    )
  } else {
    // Fallback para browsers sem requestIdleCallback
    setTimeout(() => {
      importFn().catch(() => {})
      preloadedChunks.add(key)
    }, 2000)
  }
}

/**
 * Precarrega rotas mais comuns apos login
 * Chamado no AppLayout apos render inicial
 */
export function preloadCommonRoutes() {
  // Rotas que quase todo usuario acessa
  preloadRoute(() => import('@/modules/contatos/pages/ContatosPage'))
  preloadRoute(() => import('@/modules/negocios/pages/NegociosPage'))
  preloadRoute(() => import('@/modules/tarefas/pages/TarefasPage'))
}

/**
 * Precarrega rotas de configuracao
 * Chamado quando usuario hover no menu de configuracoes
 */
export function preloadConfigRoutes() {
  preloadRoute(() => import('@/modules/configuracoes/layouts/ConfiguracoesLayout'))
}

/**
 * Precarrega rotas de admin
 * Chamado apenas para super_admin
 */
export function preloadAdminRoutes() {
  preloadRoute(() => import('@/modules/admin/layouts/AdminLayout'))
  preloadRoute(() => import('@/modules/admin/pages/DashboardPage'))
}
