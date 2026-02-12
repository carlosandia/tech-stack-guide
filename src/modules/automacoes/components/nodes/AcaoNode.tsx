/**
 * AIDEV-NOTE: Nó customizado de Ação (verde) com handles horizontais e botão de excluir
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, Trash2 } from 'lucide-react'
import { ACAO_TIPOS } from '../../schemas/automacoes.schema'
import { HandleWithAdd } from './HandleWithAdd'

export interface AcaoNodeData {
  tipo?: string
  config?: Record<string, unknown>
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteNode?: (nodeId: string) => void
  [key: string]: unknown
}

export const AcaoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as AcaoNodeData
  const acaoInfo = ACAO_TIPOS.find(a => a.tipo === nodeData.tipo)

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
          ${selected ? 'ring-2 ring-green-500 shadow-md border-green-500' : 'border-green-400/60 hover:shadow-md hover:border-green-500'}
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

        {/* Handle de entrada (left) */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !-left-1.5"
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-green-50 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center">
            <Play className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Ação</p>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate">
            {acaoInfo?.label || 'Selecione uma ação'}
          </p>
          {acaoInfo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {acaoInfo.categoria}
            </p>
          )}
        </div>

        {/* Handle unificado de saída */}
        <HandleWithAdd nodeId={id} color="green" onAddNode={nodeData.onAddNode} />
      </div>
    </div>
  )
})

AcaoNode.displayName = 'AcaoNode'
