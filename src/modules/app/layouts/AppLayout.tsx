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
  Building2,
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
  Wrench,
  Megaphone,
  Send,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'


/**
 * AIDEV-NOTE: Layout principal do CRM para Admin e Member
 * Conforme Design System Seção 11 - Navegação Horizontal com Hubs
 * Header fixo (56px) + Toolbar sticky (48px)
 * Glass Effect: bg-white/80 backdrop-blur-md
 *
 * Navegação agrupada por Hubs (Comercial, Atendimento, Ferramentas)
 * para escalar com novos módulos futuros.
 */

// ─── Tipos e dados de navegação por Hub ────────────────────────────────

interface NavHubItem {
  label: string
  path: string
  icon: React.ElementType
  slug: string
  comingSoon?: boolean
}

interface NavHub {
  label: string
  icon: React.ElementType
  path?: string
  exact?: boolean
  slug?: string
  children?: NavHubItem[]
}

const navHubs: NavHub[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    exact: true,
    slug: 'dashboard',
  },
  {
    label: 'Comercial',
    icon: Briefcase,
    children: [
      { label: 'Negócios', path: '/negocios', icon: Briefcase, slug: 'negocios' },
      { label: 'Pessoas', path: '/contatos/pessoas', icon: Users, slug: 'contatos' },
      { label: 'Empresas', path: '/contatos/empresas', icon: Building2, slug: 'contatos' },
    ],
  },
  {
    label: 'Atendimento',
    icon: MessageSquare,
    children: [
      { label: 'Conversas', path: '/conversas', icon: MessageSquare, slug: 'conversas' },
      { label: 'Emails', path: '/emails', icon: Mail, slug: 'caixa-entrada-email' },
    ],
  },
  {
    label: 'Campanhas',
    icon: Megaphone,
    children: [
      { label: 'Email Marketing', path: '/campanhas/email', icon: Send, slug: 'email-marketing', comingSoon: true },
      { label: 'WhatsApp Marketing', path: '/campanhas/whatsapp', icon: WhatsAppIcon, slug: 'whatsapp-marketing', comingSoon: true },
    ],
  },
  {
    label: 'Ferramentas',
    icon: Wrench,
    children: [
      { label: 'Tarefas', path: '/tarefas', icon: CheckSquare, slug: 'atividades' },
      { label: 'Formulários', path: '/formularios', icon: FileText, slug: 'formularios' },
      { label: 'Automações', path: '/automacoes', icon: Zap, slug: 'automacoes' },
    ],
  },
]

// ─── Componentes de navegação ──────────────────────────────────────────

/** Link direto (Dashboard) - sem dropdown */
function NavDirectLink({ hub, locked }: { hub: NavHub; locked: boolean }) {
  const Icon = hub.icon
  if (locked) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent text-muted-foreground/50 cursor-not-allowed opacity-60"
        title="Módulo não disponível no seu plano"
      >
        <Icon className="w-4 h-4" />
        <span>{hub.label}</span>
        <Lock className="w-3 h-3 text-muted-foreground/40" />
      </button>
    )
  }
  return (
    <NavLink
      to={hub.path!}
      end={hub.exact}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
          isActive
            ? 'bg-muted text-foreground font-semibold'
            : 'text-muted-foreground font-medium hover:text-foreground hover:bg-accent'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span>{hub.label}</span>
    </NavLink>
  )
}

/** Hub com dropdown de subitens */
function NavHubDropdown({
  hub,
  modulosAtivos,
  pathname,
}: {
  hub: NavHub
  modulosAtivos: string[] | null | undefined
  pathname: string
}) {
  const Icon = hub.icon
  const children = hub.children || []

  // Hub ativo se qualquer filho corresponde ao pathname atual
  const isHubActive = children.some((child) => pathname.startsWith(child.path))

  // Todos os filhos bloqueados = hub inteiro bloqueado
  const allLocked = modulosAtivos
    ? children.every((c) => !c.comingSoon && !modulosAtivos.includes(c.slug))
    : false

  // Todos os filhos são "em breve"
  const allComingSoon = children.every((c) => c.comingSoon)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-all duration-200 outline-none ${
            isHubActive
              ? 'bg-muted text-foreground font-semibold'
              : allLocked
                ? 'text-muted-foreground/50 opacity-60 cursor-not-allowed font-medium'
                : 'text-muted-foreground font-medium hover:text-foreground hover:bg-accent'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{hub.label}</span>
          {allComingSoon && (
            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium leading-none">
              Em breve
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 z-[150] bg-popover">
        {children.map((child) => {
          const ChildIcon = child.icon
          const isActive = pathname.startsWith(child.path)

          // Coming soon items
          if (child.comingSoon) {
            return (
              <DropdownMenuItem
                key={child.path}
                disabled
                className="flex items-center gap-2.5 opacity-50 cursor-not-allowed"
              >
                <ChildIcon className="w-4 h-4" />
                <span>{child.label}</span>
                <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  Em breve
                </span>
              </DropdownMenuItem>
            )
          }

          const isLocked = modulosAtivos ? !modulosAtivos.includes(child.slug) : false

          if (isLocked) {
            return (
              <DropdownMenuItem
                key={child.path}
                disabled
                className="flex items-center gap-2.5 opacity-50 cursor-not-allowed"
              >
                <ChildIcon className="w-4 h-4" />
                <span>{child.label}</span>
                <Lock className="w-3 h-3 ml-auto text-muted-foreground/40" />
              </DropdownMenuItem>
            )
          }

          return (
            <DropdownMenuItem key={child.path} asChild className="cursor-pointer">
              <NavLink
                to={child.path}
                className={`flex items-center gap-2.5 w-full ${
                  isActive ? 'text-primary font-medium' : ''
                }`}
              >
                <ChildIcon className="w-4 h-4" />
                <span>{child.label}</span>
              </NavLink>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Utilitários ───────────────────────────────────────────────────────

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

// ─── Layout principal ──────────────────────────────────────────────────

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
  useEffect(() => {
    preloadCommonRoutes()
  }, [])

  useBlockedRedirect()

  const isAdmin = role === 'admin'
  const pageTitle = getPageTitle(location.pathname)
  const isEditorRoute = isFormularioEditorRoute(location.pathname)
  const isPipelineConfig = isPipelineConfigRoute(location.pathname)
  const isPerfilRoute = location.pathname === '/perfil'
  const isDashboard = location.pathname === '/dashboard'
  const hideToolbar = isEditorRoute || isPipelineConfig || isPerfilRoute || isDashboard
  const hideHeader = isEditorRoute

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

      {/* Mobile drawer — agrupado por Hub */}
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

        <nav className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-56px-64px)]">
          {navHubs.map((hub) => {
            // Item direto (Dashboard)
            if (hub.path) {
              const isLocked = modulosAtivos && hub.slug ? !modulosAtivos.includes(hub.slug) : false
              if (isLocked) {
                return (
                  <button
                    key={hub.label}
                    type="button"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground/50 cursor-not-allowed opacity-60 w-full"
                    title="Módulo não disponível no seu plano"
                  >
                    <hub.icon className="w-5 h-5" />
                    {hub.label}
                    <Lock className="w-3.5 h-3.5 ml-auto text-muted-foreground/40" />
                  </button>
                )
              }
              return (
                <NavLink
                  key={hub.label}
                  to={hub.path}
                  end={hub.exact}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'border border-primary/40 bg-primary/5 text-primary'
                        : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <hub.icon className="w-5 h-5" />
                  {hub.label}
                </NavLink>
              )
            }

            // Grupo com label + subitens
            return (
              <div key={hub.label}>
                <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {hub.label}
                </p>
                <div className="space-y-0.5">
                  {hub.children?.map((child) => {
                    // Coming soon items
                    if (child.comingSoon) {
                      return (
                        <button
                          key={child.path}
                          type="button"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground/50 cursor-not-allowed opacity-50 w-full"
                        >
                          <child.icon className="w-5 h-5" />
                          {child.label}
                          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            Em breve
                          </span>
                        </button>
                      )
                    }
                    const isLocked = modulosAtivos ? !modulosAtivos.includes(child.slug) : false
                    if (isLocked) {
                      return (
                        <button
                          key={child.path}
                          type="button"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground/50 cursor-not-allowed opacity-60 w-full"
                          title="Módulo não disponível no seu plano"
                        >
                          <child.icon className="w-5 h-5" />
                          {child.label}
                          <Lock className="w-3.5 h-3.5 ml-auto text-muted-foreground/40" />
                        </button>
                      )
                    }
                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setDrawerOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'border border-primary/40 bg-primary/5 text-primary'
                              : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`
                        }
                      >
                        <child.icon className="w-5 h-5" />
                        {child.label}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Configurações — admin only */}
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

      {/* Header fixo - 56px - Glass Effect */}
      {!hideHeader && (
        <header className="flex-shrink-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-6">
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

              {/* Desktop Navigation — Hubs */}
              <nav className="hidden md:flex items-center gap-1">
                {navHubs.map((hub) => {
                  if (hub.path) {
                    const isLocked = modulosAtivos && hub.slug ? !modulosAtivos.includes(hub.slug) : false
                    return (
                      <NavDirectLink key={hub.label} hub={hub} locked={isLocked} />
                    )
                  }
                  return (
                    <NavHubDropdown
                      key={hub.label}
                      hub={hub}
                      modulosAtivos={modulosAtivos}
                      pathname={location.pathname}
                    />
                  )
                })}
              </nav>
            </div>

            {/* Right: Settings gear + Notificacoes + User Menu */}
            <div className="flex items-center gap-0.5">
              <FeedbackButton />

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

      {/* Toolbar sticky - 48px */}
      {!hideToolbar && <ToolbarWithActions pageTitle={pageTitle} />}

      {/* Main content */}
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
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
          <h1 className="text-sm sm:text-base font-semibold text-foreground whitespace-nowrap hidden sm:block">
            {pageTitle}
          </h1>
          {subtitle && subtitle}
        </div>
        {centerContent && (
          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start min-w-0 sm:mx-4">
            {centerContent}
          </div>
        )}
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
