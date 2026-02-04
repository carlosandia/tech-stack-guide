/**
 * AIDEV-NOTE: Exports do modulo Admin
 * Conforme PRD-14 - Painel Super Admin
 */

// Layout
export { AdminLayout } from './layouts/AdminLayout'

// Pages
export { DashboardPage as AdminDashboardPage } from './pages/DashboardPage'
export { OrganizacoesPage as AdminOrganizacoesPage } from './pages/OrganizacoesPage'

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
