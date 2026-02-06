import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { ConfigToolbarProvider } from '../contexts/ConfigToolbarContext'
import { ConfigHeader } from '../components/layout/ConfigHeader'
import { ConfigSidebar, getPageTitleFromSidebar } from '../components/layout/ConfigSidebar'
import { ConfigToolbar } from '../components/layout/ConfigToolbar'
import { ConfigMobileDrawer } from '../components/layout/ConfigMobileDrawer'

/**
 * AIDEV-NOTE: Layout do módulo de Configurações
 * Header fixo (56px) + Sidebar lateral (240px, desktop) + Toolbar contextual + Content
 * Mobile: drawer lateral com mesmos itens
 */

function ConfiguracoesLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAdmin = role === 'admin'
  const pageTitle = getPageTitleFromSidebar(location.pathname)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Mobile drawer */}
      <ConfigMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Header fixo */}
      <ConfigHeader onMenuClick={() => setDrawerOpen(true)} />

      {/* Desktop sidebar */}
      <ConfigSidebar isAdmin={isAdmin} />

      {/* Content area - offset pela sidebar no desktop */}
      <div className="lg:ml-60">
        {/* Toolbar contextual */}
        <ConfigToolbar pageTitle={pageTitle} />

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function ConfiguracoesLayout() {
  return (
    <ConfigToolbarProvider>
      <ConfiguracoesLayoutInner />
    </ConfigToolbarProvider>
  )
}

export default ConfiguracoesLayout
