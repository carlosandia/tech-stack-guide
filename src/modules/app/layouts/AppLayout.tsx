import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useBlockedRedirect } from '@/hooks/useBlockedRedirect'
import { AppToolbarProvider, useAppToolbar } from '../contexts/AppToolbarContext'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Layout principal do CRM para Admin e Member
 * Conforme Design System Seção 11 - Navegação Horizontal
 * Header fixo (56px) + Toolbar sticky (48px)
 * Glass Effect: bg-white/80 backdrop-blur-md
 */

const menuItems = [
  {
    label: 'Dashboard',
    path: '/app',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Contatos',
    path: '/app/contatos',
    icon: Users,
  },
  {
    label: 'Negócios',
    path: '/app/negocios',
    icon: Briefcase,
  },
  {
    label: 'Conversas',
    path: '/app/conversas',
    icon: MessageSquare,
  },
  {
    label: 'Tarefas',
    path: '/app/tarefas',
    icon: CheckSquare,
  },
  {
    label: 'Configurações',
    path: '/app/configuracoes',
    icon: Settings,
    adminOnly: true,
  },
]

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
            : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </NavLink>
  )
}

function getPageTitle(pathname: string): string {
  if (pathname === '/app') return 'Dashboard'
  if (pathname.startsWith('/app/contatos')) return 'Contatos'
  if (pathname.startsWith('/app/negocios')) return 'Negócios'
  if (pathname.startsWith('/app/conversas')) return 'Conversas'
  if (pathname.startsWith('/app/tarefas')) return 'Tarefas'
  if (pathname.startsWith('/app/configuracoes')) return 'Configurações'
  return 'CRM'
}

function AppLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useBlockedRedirect()

  const isAdmin = role === 'admin'
  const pageTitle = getPageTitle(location.pathname)
  const visibleItems = menuItems.filter(item => !('adminOnly' in item && item.adminOnly) || isAdmin)

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
          transform transition-transform duration-200 ease-in-out md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg text-foreground">CRM Renove</span>
          </div>
          <button
            className="p-1 hover:bg-accent rounded-md"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border border-primary/40 bg-primary/5 text-primary'
                    : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
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
              className="md:hidden p-2 -ml-2 hover:bg-accent rounded-md"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <span className="hidden sm:block font-semibold text-lg text-foreground">
                CRM Renove
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleItems.map((item) => (
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

          {/* Right: User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-all duration-200"
            >
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.nome?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground max-w-[150px] truncate">
                {user?.nome || 'Usuário'}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                    <p className="text-sm font-medium text-foreground">
                      {user?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {role === 'admin' ? 'Admin' : 'Membro'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar sticky - 48px */}
      <ToolbarWithActions pageTitle={pageTitle} />

      {/* Main content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

function ToolbarWithActions({ pageTitle }: { pageTitle: string }) {
  const { actions, subtitle } = useAppToolbar()

  return (
    <div className="sticky top-14 z-50 h-12 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* Left: Título + Descrição */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-foreground whitespace-nowrap">
            {pageTitle}
          </h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[300px]">
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

export function AppLayout() {
  return (
    <AppToolbarProvider>
      <AppLayoutInner />
    </AppToolbarProvider>
  )
}

export default AppLayout
