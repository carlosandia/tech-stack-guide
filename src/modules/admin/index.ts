/**
 * AIDEV-NOTE: Exports do modulo Admin
 * Conforme PRD-14 - Painel Super Admin
 * AIDEV-NOTE: Pages usam export default - usar sintaxe { default as X }
 */

// Layout
export { default as AdminLayout } from './layouts/AdminLayout'

// Pages
export { default as AdminDashboardPage } from './pages/DashboardPage'
export { default as AdminModulosPage } from './pages/ModulosPage'
export { default as AdminOrganizacoesPage } from './pages/OrganizacoesPage'
export { default as AdminOrganizacaoDetalhesPage } from './pages/OrganizacaoDetalhesPage'
export { default as AdminPlanosPage } from './pages/PlanosPage'
export { default as AdminConfiguracoesGlobaisPage } from './pages/ConfiguracoesGlobaisPage'
export { default as AdminEvolucaoPage } from './pages/EvolucaoPage'

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
