import { useState } from 'react'
import { LogoRenove } from '@/components/LogoRenove'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { ToolbarProvider, useToolbar } from '../contexts/ToolbarContext'
import { NotificacoesSino } from '@/modules/feedback/components/NotificacoesSino'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Puzzle,
  Settings,
  Lightbulb,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  ChevronDown,
  Users2,
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
    label: 'Parceiros',
    path: '/admin/parceiros',
    icon: Users2,
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
        `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-muted text-foreground font-bold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
  if (pathname.startsWith('/admin/parceiros')) return 'Parceiros'
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
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [drawerOpen, setDrawerOpen] = useState(false)

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
          fixed inset-y-0 left-0 z-[300] w-64 bg-background/95 backdrop-blur-md border-r border-border/60
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <LogoRenove className="h-7" />
          </div>
          <button
            className="p-1 hover:bg-muted/70 rounded-md"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5 text-muted-foreground" />
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
                `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-muted text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Header fixo - 56px - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 hover:bg-muted/70 rounded-md"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <LogoRenove className="hidden sm:block h-7" />
              <LogoRenove className="sm:hidden h-6" />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-all duration-200">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-foreground">
                    {user?.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    Super
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault()
                    setTheme(isDark ? 'light' : 'dark')
                  }}
                >
                  {isDark ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                  Tema Escuro
                  <Switch
                    checked={isDark}
                    className="ml-auto"
                    onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                  />
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
    <div className="sticky top-14 z-50 h-12 bg-muted/50 backdrop-blur-sm border-b border-border/60">
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

// Componente exportado que provê o contexto
// AIDEV-NOTE: Usar apenas export default para evitar erro de inicialização circular no bundler
function AdminLayout() {
  return (
    <ToolbarProvider>
      <AdminLayoutInner />
    </ToolbarProvider>
  )
}

export default AdminLayout
