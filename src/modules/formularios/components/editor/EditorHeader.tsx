/**
 * AIDEV-NOTE: Header do editor de formulário
 * Exibe nome, status, tabs de navegação e ações (publicar, voltar) em uma única linha
 */

import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormularioStatusBadge } from '../FormularioStatusBadge'
import { FormularioTipoBadge } from '../FormularioTipoBadge'
import type { Formulario } from '../../services/formularios.api'
import { usePublicarFormulario, useDespublicarFormulario } from '../../hooks/useFormularios'

interface TabDef {
  key: string
  label: string
  icon: React.ElementType
}

interface Props {
  formulario: Formulario
  tabs?: TabDef[]
  activeTab?: string
  onTabChange?: (key: string) => void
}

export function EditorHeader({ formulario, tabs, activeTab, onTabChange }: Props) {
  const navigate = useNavigate()
  const publicar = usePublicarFormulario()
  const despublicar = useDespublicarFormulario()

  return (
    <div className="flex items-center border-b border-border bg-card px-4 py-1.5 gap-4 min-h-[44px]">
      {/* Left: Back + Name + Badges */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => navigate('/app/formularios')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground truncate">{formulario.nome}</h1>
        <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
        <span className="hidden sm:inline"><FormularioTipoBadge tipo={formulario.tipo} /></span>
        <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
        <span className="hidden sm:inline"><FormularioStatusBadge status={formulario.status} /></span>
      </div>

      {/* Center: Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 justify-center">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onTabChange?.(key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2',
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Right: Publish */}
      <div className="flex items-center gap-2 shrink-0">
        {formulario.status === 'publicado' ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => despublicar.mutate(formulario.id)}
            disabled={despublicar.isPending}
          >
            <EyeOff className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Despublicar</span>
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => publicar.mutate(formulario.id)}
            disabled={publicar.isPending}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Publicar</span>
          </Button>
        )}
      </div>
    </div>
  )
}
