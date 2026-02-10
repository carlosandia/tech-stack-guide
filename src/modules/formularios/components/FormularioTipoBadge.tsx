/**
 * AIDEV-NOTE: Badge de tipo para formulários
 * Conforme Design System - seção 10.3 Badge
 */

import { Badge } from '@/components/ui/badge'
import { FileText, MessageSquare, Mail, Layers } from 'lucide-react'
import type { TipoFormulario } from '../services/formularios.api'

const tipoConfig: Record<TipoFormulario, { label: string; icon: typeof FileText }> = {
  inline: { label: 'Padrão', icon: FileText },
  popup: { label: 'Popup', icon: MessageSquare },
  newsletter: { label: 'Newsletter', icon: Mail },
  multi_step: { label: 'Por Etapas', icon: Layers },
}

interface Props {
  tipo: TipoFormulario
}

export function FormularioTipoBadge({ tipo }: Props) {
  const config = tipoConfig[tipo] || tipoConfig.inline
  const Icon = config.icon
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}
