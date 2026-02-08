import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { ToolbarProvider, useToolbar } from '../contexts/ToolbarContext'
import { NotificacoesSino } from '@/modules/feedback/components/NotificacoesSino'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Puzzle,
  Settings,
  Lightbulb,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Layout do Painel Super Admin
 * Conforme PRD-14 + Design System (Seção 11 - Navegação Horizontal)
 *
 * Estrutura:
 * - Header fixo (56px) com navegação horizontal
 * - Toolbar sticky (48px) com contexto da página + ações injetadas
 * - Content area com padding adequado
 */

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Organizações',
    path: '/admin/organizacoes',
    icon: Building2,
  },
  {
    label: 'Planos',
    path: '/admin/planos',
    icon: CreditCard,
  },
  {
    label: 'Módulos',
    path: '/admin/modulos',
    icon: Puzzle,
  },
  {
    label: 'Evolução',
    path: '/admin/evolucao',
    icon: Lightbulb,
  },
  {
    label: 'Configurações',
    path: '/admin/configuracoes',
    icon: Settings,
  },
]

// Componente de item de navegação horizontal
function NavItem({
  to,
  exact,
  children,
  icon: Icon,
  onClick,
}: {
  to: string
  exact?: boolean
  children: React.ReactNode
  icon: React.ElementType
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'border border-primary/40 bg-primary/5 text-primary'
            : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </NavLink>
  )
}

// Títulos das páginas para o toolbar
function getPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Dashboard'
  if (pathname.startsWith('/admin/organizacoes')) return 'Organizações'
  if (pathname.startsWith('/admin/planos')) return 'Planos'
  if (pathname.startsWith('/admin/modulos')) return 'Módulos'
  if (pathname.startsWith('/admin/evolucao')) return 'Evolução do Produto'
  if (pathname.startsWith('/admin/configuracoes')) return 'Configurações'
  return 'Super Admin'
}

function AdminLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[200] bg-foreground/20 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[300] w-64 bg-white/95 backdrop-blur-md border-r border-gray-200/60
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">CRM Renove</span>
          </div>
          <button
            className="p-1 hover:bg-gray-100/70 rounded-md"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Drawer navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border border-primary/40 bg-primary/5 text-primary'
                    : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100/50 hover:text-gray-700 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Header fixo - 56px - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 hover:bg-gray-100/70 rounded-md"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <span className="hidden sm:block font-semibold text-lg text-gray-900">
                CRM Renove
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => (
                <NavItem
                  key={item.path}
                  to={item.path}
                  exact={item.exact}
                  icon={item.icon}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>
          </div>

          {/* Right: Notificações + User Menu */}
          <div className="flex items-center gap-1">
            {/* Sino de Notificações */}
            <NotificacoesSino />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100/70 rounded-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.nome?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
                  {user?.nome || 'Usuário'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-gray-200/60 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-200/60">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.nome || 'Usuário'}
                      </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Super Admin
                    </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100/70"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar sticky - 48px */}
      <ToolbarWithActions pageTitle={pageTitle} />

      {/* Main content - pt-[104px] = 56px header + 48px toolbar */}
      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

// Componente separado para usar o hook useToolbar
function ToolbarWithActions({ pageTitle }: { pageTitle: string }) {
  const { actions, subtitle } = useToolbar()

  return (
    <div className="sticky top-14 z-50 h-12 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* Left: Título + Descrição */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-gray-800 whitespace-nowrap">
            {pageTitle}
          </h1>
          {subtitle && (
            <>
              <span className="text-gray-400 hidden sm:inline">·</span>
              <span className="text-sm text-gray-500 hidden sm:inline truncate max-w-[300px]">
                {subtitle}
              </span>
            </>
          )}
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      </div>
    </div>
  )
}

// Componente exportado que provê o contexto
export function AdminLayout() {
  return (
    <ToolbarProvider>
      <AdminLayoutInner />
    </ToolbarProvider>
  )
}

export default AdminLayout
