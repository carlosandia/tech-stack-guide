/**
 * AIDEV-NOTE: Exports do modulo Admin
 * Conforme PRD-14 - Painel Super Admin
 */

// Layout
export { AdminLayout } from './layouts/AdminLayout'

// Pages
export { DashboardPage as AdminDashboardPage } from './pages/DashboardPage'
export { OrganizacoesPage as AdminOrganizacoesPage } from './pages/OrganizacoesPage'
export { OrganizacaoDetalhesPage as AdminOrganizacaoDetalhesPage } from './pages/OrganizacaoDetalhesPage'
export { PlanosPage as AdminPlanosPage } from './pages/PlanosPage'
export { ConfiguracoesGlobaisPage as AdminConfiguracoesGlobaisPage } from './pages/ConfiguracoesGlobaisPage'

// Components
export { NovaOrganizacaoModal } from './components/NovaOrganizacaoModal'
export { PlanoFormModal } from './components/PlanoFormModal'
export { GerenciarModulosModal } from './components/GerenciarModulosModal'
export { OrganizacaoUsuariosTab } from './components/OrganizacaoUsuariosTab'
export { OrganizacaoRelatoriosTab } from './components/OrganizacaoRelatoriosTab'
export { OrganizacaoConfigTab } from './components/OrganizacaoConfigTab'

// Hooks
export { 
  useOrganizacoes, 
  useOrganizacao, 
  useCreateOrganizacao,
  useUsuariosOrganizacao,
  useLimitesOrganizacao,
  useModulosOrganizacao,
  useSuspenderOrganizacao,
  useReativarOrganizacao,
  useImpersonarOrganizacao,
} from './hooks/useOrganizacoes'
export { usePlanos, usePlano, useModulos } from './hooks/usePlanos'
export { useConfigGlobais, useConfigGlobal, useUpdateConfigGlobal, useTestarConfigGlobal } from './hooks/useConfigGlobal'

// API
export { adminApi } from './services/admin.api'
export type {
  Organizacao,
  ListaOrganizacoesResponse,
  CriarOrganizacaoPayload,
  Plano,
  Modulo,
  ConfigGlobal,
  MetricasResumo,
  LimitesUso,
} from './services/admin.api'
