/**
 * AIDEV-NOTE: Nó customizado de Ação (verde)
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import { ACAO_TIPOS } from '../../schemas/automacoes.schema'
import { AddNodeButton } from './AddNodeButton'

export interface AcaoNodeData {
  tipo?: string
  config?: Record<string, unknown>
  onAddNode?: (type: 'acao' | 'condicao' | 'delay', sourceNodeId: string, sourceHandle?: string) => void
  [key: string]: unknown
}

export const AcaoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as AcaoNodeData
  const acaoInfo = ACAO_TIPOS.find(a => a.tipo === nodeData.tipo)

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-green-500 shadow-md border-green-500' : 'border-green-400/60 hover:shadow-md hover:border-green-500'}
        `}
      >
        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !-top-1.5"
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

        {/* Handle de saída */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !-bottom-1.5"
        />
      </div>

      {/* Botão + abaixo do nó */}
      <AddNodeButton nodeId={id} onAddNode={nodeData.onAddNode} />
    </div>
  )
})

AcaoNode.displayName = 'AcaoNode'
