import { useState, forwardRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useBlockedRedirect } from '@/hooks/useBlockedRedirect'
import { AppToolbarProvider, useAppToolbar } from '../contexts/AppToolbarContext'
import { FeedbackButton } from '@/modules/feedback/components/FeedbackButton'
import { NotificacoesSino } from '@/modules/feedback/components/NotificacoesSino'
import renoveLogo from '@/assets/logotipo-renove.svg'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  CheckSquare,
  Mail,
  FileText,
  Zap,
  Settings,
  LogOut,
  User,
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
    path: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Contatos',
    path: '/contatos',
    icon: Users,
  },
  {
    label: 'Negócios',
    path: '/negocios',
    icon: Briefcase,
  },
  {
    label: 'Conversas',
    path: '/conversas',
    icon: MessageSquare,
  },
  {
    label: 'Emails',
    path: '/emails',
    icon: Mail,
  },
  {
    label: 'Tarefas',
    path: '/tarefas',
    icon: CheckSquare,
  },
  {
    label: 'Formulários',
    path: '/formularios',
    icon: FileText,
  },
  {
    label: 'Automações',
    path: '/automacoes',
    icon: Zap,
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
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname.startsWith('/contatos')) return 'Contatos'
  if (pathname.startsWith('/negocios')) return 'Negócios'
  if (pathname.startsWith('/conversas')) return 'Conversas'
  if (pathname.startsWith('/emails')) return 'Emails'
  if (pathname.startsWith('/tarefas')) return 'Tarefas'
  if (pathname.startsWith('/configuracoes')) return 'Configurações'
  if (pathname.startsWith('/formularios')) return 'Formulários'
  if (pathname.startsWith('/automacoes')) return 'Automações'
  return 'CRM'
}

function isFormularioEditorRoute(pathname: string): boolean {
  return /^\/formularios\/[^/]+$/.test(pathname)
}

function isPipelineConfigRoute(pathname: string): boolean {
  return /^\/negocios\/pipeline\/[^/]+$/.test(pathname)
}

function AppLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useBlockedRedirect()

  const isAdmin = role === 'admin' // used for settings gear visibility
  const pageTitle = getPageTitle(location.pathname)
  const isEditorRoute = isFormularioEditorRoute(location.pathname)
  const isPipelineConfig = isPipelineConfigRoute(location.pathname)
  const isPerfilRoute = location.pathname === '/perfil'
  const hideToolbar = isEditorRoute || isPipelineConfig || isPerfilRoute
  const hideHeader = isEditorRoute
  const visibleItems = menuItems

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
            <img src={renoveLogo} alt="Renove" className="h-7" />
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
          {/* Configurações link — admin only in mobile drawer */}
          {isAdmin && (
            <NavLink
              to="/configuracoes"
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border border-primary/40 bg-primary/5 text-primary'
                    : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              Configurações
            </NavLink>
          )}
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

      {/* Header fixo - 56px - Glass Effect - hidden on formulario editor */}
      {!hideHeader && (
        <header className="flex-shrink-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
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
                <img src={renoveLogo} alt="Renove" className="hidden sm:block h-7" />
                <img src={renoveLogo} alt="Renove" className="sm:hidden h-6" />
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

            {/* Right: Settings gear + Notificacoes + User Menu */}
            <div className="flex items-center gap-1">
              {/* Settings gear icon — admin only */}
              {isAdmin && (
                <NavLink
                  to="/configuracoes"
                  className={({ isActive }) =>
                    `p-2 rounded-md transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                  title="Configurações"
                >
                  <Settings className="w-5 h-5" />
                </NavLink>
              )}

              {/* Sino de Notificacoes */}
              <NotificacoesSino />

              {/* User Menu */}
              <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-muted">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {user?.nome?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
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
                    className="fixed inset-0 z-[199]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-border py-1 z-[200]">
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
                    <NavLink
                      to="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </NavLink>
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
            </div>
        </header>
      )}

      {/* Toolbar sticky - 48px (hidden on formulario editor) */}
      {!hideToolbar && <ToolbarWithActions pageTitle={pageTitle} />}

      {/* Main content - flex-1 preenche altura restante, overflow-hidden para scroll interno das páginas */}
      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'hsl(220, 10%, 95%)' }}>
        <Outlet />
      </main>

      {/* Botao flutuante de Feedback */}
      <FeedbackButton />
    </div>
  )
}

const ToolbarWithActions = forwardRef<HTMLDivElement, { pageTitle: string }>(function ToolbarWithActions({ pageTitle }, ref) {
  const { actions, subtitle, centerContent } = useAppToolbar()

  return (
    <div ref={ref} className="flex-shrink-0 z-50 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      <div className={`flex items-center justify-between min-h-[48px] px-3 sm:px-4 lg:px-6 max-w-[1920px] mx-auto py-1.5 gap-1.5 ${centerContent ? 'flex-wrap' : ''}`}>
        {/* Left: Título + Subtitle */}
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          <h1 className="text-sm sm:text-base font-semibold text-foreground whitespace-nowrap hidden sm:block">
            {pageTitle}
          </h1>
          {subtitle && subtitle}
        </div>

        {/* Center: Optional content */}
        {centerContent && (
          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start min-w-0 sm:mx-4">
            {centerContent}
          </div>
        )}

        {/* Right: Actions - full width on mobile when center content exists */}
        <div className={`flex items-center gap-1 sm:gap-1.5 justify-center sm:justify-end ${centerContent ? 'w-full sm:w-auto' : ''}`}>
          {actions}
        </div>
      </div>
    </div>
  )
})

export function AppLayout() {
  return (
    <AppToolbarProvider>
      <AppLayoutInner />
    </AppToolbarProvider>
  )
}

export default AppLayout
