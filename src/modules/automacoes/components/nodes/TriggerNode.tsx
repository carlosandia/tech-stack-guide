/**
 * AIDEV-NOTE: Nó customizado de Trigger para o canvas React Flow
 * Handles horizontais: saída à direita. Botão de excluir visível no hover.
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap, Trash2 } from 'lucide-react'
import { TRIGGER_TIPOS } from '../../schemas/automacoes.schema'
import { AddNodeButton } from './AddNodeButton'

export interface TriggerNodeData {
  trigger_tipo?: string
  trigger_config?: Record<string, unknown>
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteNode?: (nodeId: string) => void
  [key: string]: unknown
}

export const TriggerNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeData
  const triggerInfo = TRIGGER_TIPOS.find(t => t.tipo === nodeData.trigger_tipo)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    nodeData.onDeleteNode?.(id)
  }

  return (
    <div className="flex items-center group/node">
      <div
        className={`
          relative bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-primary shadow-md border-primary' : 'border-primary/60 hover:shadow-md hover:border-primary'}
        `}
      >
        {/* Botão excluir */}
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/node:opacity-100 hover:bg-destructive hover:border-destructive hover:text-white text-muted-foreground transition-all duration-200 z-10"
          title="Excluir nó"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-primary/5 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Gatilho</p>
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

        {/* Handle de saída (right) */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-primary !border-2 !border-white !-right-1.5"
        />
      </div>

      {/* Botão + à direita do nó */}
      <AddNodeButton nodeId={id} onAddNode={nodeData.onAddNode} />
    </div>
  )
})

TriggerNode.displayName = 'TriggerNode'
