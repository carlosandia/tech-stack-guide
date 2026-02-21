/**
 * AIDEV-NOTE: Barrel export do módulo App (tenant)
 * AIDEV-NOTE: Pages/Layouts usam export default - usar sintaxe { default as X }
 */

export { default as AppLayout } from './layouts/AppLayout'
export { default as AppDashboardPage } from './pages/DashboardPage'
export { default as PerfilPage } from './pages/PerfilPage'
export { AppToolbarProvider, useAppToolbar } from './contexts/AppToolbarContext'
export type {} from './contexts/AppToolbarContext'
