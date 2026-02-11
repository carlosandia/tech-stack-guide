/**
 * AIDEV-NOTE: Nó customizado de Trigger para o canvas React Flow
 * Primeiro nó do fluxo, não removível. Borda primary.
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'
import { TRIGGER_TIPOS } from '../../schemas/automacoes.schema'

export interface TriggerNodeData {
  trigger_tipo?: string
  trigger_config?: Record<string, unknown>
  [key: string]: unknown
}

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeData
  const triggerInfo = TRIGGER_TIPOS.find(t => t.tipo === nodeData.trigger_tipo)

  return (
    <div
      className={`
        bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
        transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-primary shadow-md border-primary' : 'border-primary/60 hover:shadow-md hover:border-primary'}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-primary/5 rounded-t-lg">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Gatilho</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate">
          {triggerInfo?.label || 'Selecione um gatilho'}
        </p>
        {triggerInfo && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {triggerInfo.categoria}
          </p>
        )}
      </div>

      {/* Handle de saída (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-white !-bottom-1.5"
      />
    </div>
  )
})

TriggerNode.displayName = 'TriggerNode'
