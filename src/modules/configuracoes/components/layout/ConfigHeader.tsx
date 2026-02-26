import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  ChevronDown,
  LogOut,
  Menu,
  User,
} from 'lucide-react'
import { useParceiroStatus } from '@/hooks/useParceiroStatus'
import { EmblemaParceiroNivel } from '@/modules/admin/components/EmblemaParceiroNivel'

/**
 * AIDEV-NOTE: Header fixo do módulo Configurações
 * Simplificado: Voltar ao CRM + título + menu do usuário
 * Glass Effect conforme DS
 */

interface ConfigHeaderProps {
  onMenuClick: () => void
}

export function ConfigHeader({ onMenuClick }: ConfigHeaderProps) {
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()
  const parceiroStatus = useParceiroStatus()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* Left: Mobile menu + Back + Title */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 -ml-2 hover:bg-accent rounded-md"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={() => {
              const lastRoute = localStorage.getItem('crm_last_route') || '/dashboard'
              navigate(lastRoute)
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">CRM</span>
          </button>

          <div className="hidden sm:flex h-6 w-px bg-border" />

          <span className="hidden sm:block font-semibold text-foreground">
            Configurações
          </span>
        </div>

        {/* Right: User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-all duration-200">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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
              <p className="text-sm font-medium text-foreground">{user?.nome || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {role === 'super_admin' ? 'Super' : role === 'admin' ? 'Admin' : 'Membro'}
                </span>
                {parceiroStatus.isParceiro && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" title={parceiroStatus.nivelNome ? `Parceiro ${parceiroStatus.nivelNome}` : 'Parceiro'}>
                    {parceiroStatus.nivelCor && <EmblemaParceiroNivel cor={parceiroStatus.nivelCor} size={16} />}
                    {parceiroStatus.nivelNome ? `Partner · ${parceiroStatus.nivelNome}` : 'Partner'}
                  </div>
                )}
              </div>
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
    </header>
  )
}
