import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { ConfigToolbarProvider, useConfigToolbar } from '../contexts/ConfigToolbarContext'
import {
  Sliders,
  Plug,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Layout do módulo de Configurações
 * Conforme Design System Seção 11 - Navegação Horizontal
 * Header fixo (56px) + Toolbar sticky (48px) com sub-navegação
 * Glass Effect: bg-white/80 backdrop-blur-md
 *
 * Acessível por Admin e Member (com restrições para Member)
 */

// Grupos de navegação no Header
interface NavGroup {
  key: string
  label: string
  icon: React.ElementType
  adminOnly: boolean
  defaultPath: string
  subItems: Array<{ label: string; path: string; adminOnly?: boolean }>
}

const navGroups: NavGroup[] = [
  {
    key: 'pipeline',
    label: 'Pipeline',
    icon: Sliders,
    adminOnly: false,
    defaultPath: '/app/configuracoes/campos',
    subItems: [
      { label: 'Campos', path: '/app/configuracoes/campos' },
      { label: 'Produtos', path: '/app/configuracoes/produtos' },
      { label: 'Motivos', path: '/app/configuracoes/motivos' },
      { label: 'Tarefas', path: '/app/configuracoes/tarefas' },
      { label: 'Etapas', path: '/app/configuracoes/etapas' },
      { label: 'Regras', path: '/app/configuracoes/regras' },
      { label: 'Cards', path: '/app/configuracoes/cards', adminOnly: true },
    ],
  },
  {
    key: 'integracoes',
    label: 'Integrações',
    icon: Plug,
    adminOnly: true,
    defaultPath: '/app/configuracoes/conexoes',
    subItems: [
      { label: 'Conexões', path: '/app/configuracoes/conexoes' },
      { label: 'Webhooks Entrada', path: '/app/configuracoes/webhooks-entrada' },
      { label: 'Webhooks Saída', path: '/app/configuracoes/webhooks-saida' },
    ],
  },
  {
    key: 'equipe',
    label: 'Equipe',
    icon: Users,
    adminOnly: true,
    defaultPath: '/app/configuracoes/membros',
    subItems: [
      { label: 'Membros', path: '/app/configuracoes/membros' },
      { label: 'Perfis', path: '/app/configuracoes/perfis' },
      { label: 'Metas', path: '/app/configuracoes/metas' },
      { label: 'Config Geral', path: '/app/configuracoes/config-geral', adminOnly: true },
    ],
  },
]

function getActiveGroup(pathname: string): NavGroup | null {
  for (const group of navGroups) {
    if (group.subItems.some(item => pathname.startsWith(item.path))) {
      return group
    }
  }
  return navGroups[0] // default to Pipeline
}

function getPageTitle(pathname: string): string {
  for (const group of navGroups) {
    for (const item of group.subItems) {
      if (pathname.startsWith(item.path)) return item.label
    }
  }
  return 'Configurações'
}

function ConfiguracoesLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = role === 'admin'
  const activeGroup = getActiveGroup(location.pathname)
  const pageTitle = getPageTitle(location.pathname)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const visibleGroups = navGroups.filter(g => !g.adminOnly || isAdmin)

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
          <span className="font-semibold text-foreground">Configurações</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <nav className="p-4 space-y-4">
          {visibleGroups.map(group => (
            <div key={group.key}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.subItems.filter(i => !i.adminOnly || isAdmin).map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/5 text-primary font-medium border border-primary/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
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
          {/* Left: Mobile menu + Back + Logo + Nav */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 hover:bg-accent rounded-md"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Voltar ao CRM */}
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </button>

            <div className="hidden md:flex h-6 w-px bg-border" />

            {/* Logo */}
            <span className="hidden md:block font-semibold text-foreground">
              Configurações
            </span>

            <div className="hidden md:flex h-6 w-px bg-border" />

            {/* Desktop Navigation - Groups */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleGroups.map(group => {
                const Icon = group.icon
                const isActive = activeGroup?.key === group.key
                return (
                  <NavLink
                    key={group.key}
                    to={group.defaultPath}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'border border-primary/40 bg-primary/5 text-primary'
                        : 'border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{group.label}</span>
                  </NavLink>
                )
              })}
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
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-56 bg-white/95 backdrop-blur-md rounded-md shadow-lg border border-gray-200/60 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-200/60">
                    <p className="text-sm font-medium text-foreground">{user?.nome || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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

      {/* Toolbar sticky - 48px - Sub-navegação */}
      <ToolbarWithSubNav pageTitle={pageTitle} activeGroup={activeGroup} isAdmin={isAdmin} />

      {/* Main content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

function ToolbarWithSubNav({
  pageTitle,
  activeGroup,
  isAdmin,
}: {
  pageTitle: string
  activeGroup: NavGroup | null
  isAdmin: boolean
}) {
  const { actions, subtitle } = useConfigToolbar()
  const subItems = activeGroup?.subItems.filter(i => !i.adminOnly || isAdmin) || []

  return (
    <div className="sticky top-14 z-50 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      {/* Sub-navegação */}
      {subItems.length > 0 && (
        <div className="hidden md:flex items-center gap-1 px-4 lg:px-6 max-w-[1920px] mx-auto h-10 overflow-x-auto">
          {subItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-background text-foreground font-medium shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Toolbar: Title + Actions */}
      <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-[1920px] mx-auto">
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
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
