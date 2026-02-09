/**
 * AIDEV-NOTE: Badge de status para formulários
 * Conforme Design System - seção 10.3 Badge
 */

import { Badge } from '@/components/ui/badge'
import type { StatusFormulario } from '../services/formularios.api'

const statusConfig: Record<StatusFormulario, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  publicado: { label: 'Publicado', variant: 'default' },
  arquivado: { label: 'Arquivado', variant: 'outline' },
}

interface Props {
  status: StatusFormulario
}

export function FormularioStatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.rascunho
  return <Badge variant={config.variant}>{config.label}</Badge>
}
