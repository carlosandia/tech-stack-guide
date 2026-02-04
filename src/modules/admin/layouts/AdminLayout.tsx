import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Puzzle,
  Settings,
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
 * - Toolbar sticky (48px) com contexto da página
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
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
  if (pathname.startsWith('/admin/configuracoes')) return 'Configurações'
  return 'Super Admin'
}

export function AdminLayout() {
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
    <div className="min-h-screen bg-background">
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
          fixed inset-y-0 left-0 z-[300] w-64 bg-background border-r border-border
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-lg text-foreground">CRM Renove</span>
          </div>
          <button
            className="p-1 hover:bg-muted rounded-md"
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
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Header fixo - 56px */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 hover:bg-muted rounded-md"
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

          {/* Right: Badge + User Menu */}
          <div className="flex items-center gap-3">
            {/* Badge Super Admin */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Super Admin
            </span>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              >
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[150px] truncate">
                  {user?.email}
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
                  <div className="absolute right-0 mt-1 w-56 bg-card rounded-md shadow-lg border border-border py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">Super Admin</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted"
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
      <div className="fixed top-14 left-0 right-0 z-50 h-12 bg-muted/50 border-b border-border">
        <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
          <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
          {/* Espaço reservado para ações contextuais (botões de busca, novo, etc.) */}
          <div id="toolbar-actions" />
        </div>
      </div>

      {/* Main content - pt-[104px] = 56px header + 48px toolbar */}
      <main className="pt-[104px] p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
