import { Navigate, useLocation } from 'react-router-dom'
import { useIsModuloBloqueado } from '@/hooks/useModulosTenant'

/**
 * AIDEV-NOTE: Guard que bloqueia acesso direto via URL a módulos não incluídos no plano.
 * Redireciona para /dashboard se o módulo está bloqueado.
 * Usado como wrapper nas rotas do CRM.
 */
export function ModuloGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const bloqueado = useIsModuloBloqueado(location.pathname)

  if (bloqueado) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
