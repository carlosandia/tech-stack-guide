import { useState, useEffect, forwardRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useModulosTenant } from '@/hooks/useModulosTenant'
import { useBlockedRedirect } from '@/hooks/useBlockedRedirect'
import { ModuloGuard } from '@/components/ModuloGuard'
import { preloadCommonRoutes } from '@/shared/utils/preload'
import { AppToolbarProvider, useAppToolbar } from '../contexts/AppToolbarContext'
import { FeedbackButton } from '@/modules/feedback/components/FeedbackButton'
import { NotificacoesSino } from '@/modules/feedback/components/NotificacoesSino'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
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
  Lock,
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
    slug: 'dashboard',
  },
  {
    label: 'Contatos',
    path: '/contatos',
    icon: Users,
    slug: 'contatos',
  },
  {
    label: 'Negócios',
    path: '/negocios',
    icon: Briefcase,
    slug: 'negocios',
  },
  {
    label: 'Conversas',
    path: '/conversas',
    icon: MessageSquare,
    slug: 'conversas',
  },
  {
    label: 'Emails',
    path: '/emails',
    icon: Mail,
    slug: 'caixa-entrada-email',
  },
  {
    label: 'Tarefas',
    path: '/tarefas',
    icon: CheckSquare,
    slug: 'atividades',
  },
  {
    label: 'Formulários',
    path: '/formularios',
    icon: FileText,
    slug: 'formularios',
  },
  {
    label: 'Automações',
    path: '/automacoes',
    icon: Zap,
    slug: 'automacoes',
  },
]

const NavItem = forwardRef<HTMLAnchorElement, {
  to: string
  exact?: boolean
  children: React.ReactNode
  icon: React.ElementType
  onClick?: () => void
  locked?: boolean
}>(function NavItem({ to, exact, children, icon: Icon, onClick, locked }, ref) {
  if (locked) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          // Could show a toast/tooltip in the future
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent text-muted-foreground/50 cursor-not-allowed opacity-60 relative group"
        title="Módulo não disponível no seu plano"
      >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground/60" />
      </button>
    )
  }

  return (
    <NavLink
      ref={ref}
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
})

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

const AppLayoutInner = forwardRef<HTMLDivElement>(function AppLayoutInner(_props, ref) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: modulosAtivos } = useModulosTenant()

  // Salvar última rota do CRM para o botão "Voltar" das Configurações
  useEffect(() => {
    localStorage.setItem('crm_last_route', location.pathname)
  }, [location.pathname])

  // AIDEV-NOTE: Precarregar rotas comuns em background apos render inicial
  // PRD: melhorias-performance.md - PARTE 5, Fase 3
  useEffect(() => {
    preloadCommonRoutes()
  }, [])

  useBlockedRedirect()

  const isAdmin = role === 'admin' // used for settings gear visibility
  const pageTitle = getPageTitle(location.pathname)
  const isEditorRoute = isFormularioEditorRoute(location.pathname)
  const isPipelineConfig = isPipelineConfigRoute(location.pathname)
  const isPerfilRoute = location.pathname === '/perfil'
  const hideToolbar = isEditorRoute || isPipelineConfig || isPerfilRoute
  const hideHeader = isEditorRoute

  // AIDEV-NOTE: Mostrar todos os módulos, mas marcar como bloqueados os que não estão no plano
  const itemsComStatus = menuItems.map(item => ({
    ...item,
    locked: modulosAtivos ? !modulosAtivos.includes(item.slug) : false,
  }))

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div ref={ref} className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Banner de impersonação */}
      <ImpersonationBanner />
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
          {itemsComStatus.map((item) => (
            item.locked ? (
              <button
                key={item.path}
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent text-muted-foreground/50 cursor-not-allowed opacity-60 w-full relative"
                title="Módulo não disponível no seu plano"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                <Lock className="w-3.5 h-3.5 ml-auto text-muted-foreground/40" />
              </button>
            ) : (
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
            )
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
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
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
                {itemsComStatus.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    exact={item.exact}
                    icon={item.icon}
                    locked={item.locked}
                  >
                    {item.label}
                  </NavItem>
                ))}
              </nav>
            </div>

            {/* Right: Settings gear + Notificacoes + User Menu */}
            <div className="flex items-center gap-0.5">
              {/* Feedback (Lampada) — admin/member */}
              <FeedbackButton />

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
                  <Settings className="w-4 h-4" />
                </NavLink>
              )}

              {/* Sino de Notificacoes */}
              <NotificacoesSino />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-all duration-200">
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
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground">
                      {user?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {role === 'admin' ? 'Admin' : 'Membro'}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
        </header>
      )}

      {/* Toolbar sticky - 48px (hidden on formulario editor) */}
      {!hideToolbar && <ToolbarWithActions pageTitle={pageTitle} />}

      {/* Main content - flex-1 preenche altura restante, overflow-hidden para scroll interno das páginas */}
      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'hsl(var(--content-bg))' }}>
        <ModuloGuard>
          <Outlet />
        </ModuloGuard>
      </main>

    </div>
  )
})

const ToolbarWithActions = forwardRef<HTMLDivElement, { pageTitle: string }>(function ToolbarWithActions({ pageTitle }, ref) {
  const { actions, subtitle, centerContent } = useAppToolbar()

  return (
    <div ref={ref} className="flex-shrink-0 z-50 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      <div className={`flex items-center justify-between min-h-[48px] px-3 sm:px-4 lg:px-6 py-1.5 gap-1.5 ${centerContent ? 'flex-wrap' : ''}`}>
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

// AIDEV-NOTE: Usar apenas export default para evitar erro de inicialização circular no bundler
const AppLayout = forwardRef<HTMLDivElement>(function AppLayout(_props, ref) {
  return (
    <AppToolbarProvider ref={ref}>
      <AppLayoutInner />
    </AppToolbarProvider>
  )
})

AppLayout.displayName = 'AppLayout'

export default AppLayout
