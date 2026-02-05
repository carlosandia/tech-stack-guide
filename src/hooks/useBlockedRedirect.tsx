import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

/**
 * AIDEV-NOTE: Hook para redirecionar usuários de organizações bloqueadas
 * Verifica org_status e redireciona para /bloqueado se necessário
 */
export function useBlockedRedirect() {
  const { user, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Não redirecionar super_admins
    if (role === 'super_admin') return

    // Não redirecionar se não autenticado
    if (!isAuthenticated || !user) return

    // Não redirecionar se já está na página de bloqueado ou planos
    const exemptPaths = ['/bloqueado', '/planos', '/sucesso', '/login', '/logout']
    if (exemptPaths.some(path => location.pathname.startsWith(path))) return

    // Se organização está bloqueada, redirecionar
    if (user.org_status === 'bloqueada') {
      navigate('/bloqueado', { replace: true })
    }
  }, [user, isAuthenticated, role, navigate, location.pathname])
}
