/**
 * AIDEV-NOTE: Header do editor de formulário
 * Exibe nome, status e ações (salvar, publicar, voltar)
 */

import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FormularioStatusBadge } from '../FormularioStatusBadge'
import { FormularioTipoBadge } from '../FormularioTipoBadge'
import type { Formulario } from '../../services/formularios.api'
import { usePublicarFormulario, useDespublicarFormulario } from '../../hooks/useFormularios'

interface Props {
  formulario: Formulario
}

export function EditorHeader({ formulario }: Props) {
  const navigate = useNavigate()
  const publicar = usePublicarFormulario()
  const despublicar = useDespublicarFormulario()

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate('/app/formularios')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{formulario.nome}</h1>
          <span className="text-muted-foreground text-xs">·</span>
          <FormularioTipoBadge tipo={formulario.tipo} />
          <span className="text-muted-foreground text-xs">·</span>
          <FormularioStatusBadge status={formulario.status} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {formulario.status === 'publicado' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => despublicar.mutate(formulario.id)}
            disabled={despublicar.isPending}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Despublicar</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => publicar.mutate(formulario.id)}
            disabled={publicar.isPending}
          >
            <Eye className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Publicar</span>
          </Button>
        )}
      </div>
    </div>
  )
}
