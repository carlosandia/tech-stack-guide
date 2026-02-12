/**
 * AIDEV-NOTE: Nó customizado de Condição com 2 saídas (Sim/Não)
 * Handles horizontais: entrada à esquerda, saídas à direita
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch, Trash2 } from 'lucide-react'
import { HandleWithAdd } from './HandleWithAdd'

interface CondicaoRegra {
  campo: string
  operador: string
  valor: string
}

export interface CondicaoNodeData {
  campo?: string
  operador?: string
  valor?: string
  label?: string
  regras?: CondicaoRegra[]
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteNode?: (nodeId: string) => void
  [key: string]: unknown
}

export const CondicaoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as CondicaoNodeData

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
          ${selected ? 'ring-2 ring-yellow-500 shadow-md border-yellow-500' : 'border-yellow-400/60 hover:shadow-md hover:border-yellow-500'}
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
          className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white !-left-1.5"
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-yellow-50 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-yellow-100 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Condição</p>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate">
            {nodeData.label || nodeData.campo || 'Configurar condição'}
          </p>
          {nodeData.operador && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {nodeData.operador} {nodeData.valor || ''}
            </p>
          )}
          {Array.isArray(nodeData.regras) && nodeData.regras.length > 1 && (
            <p className="text-[10px] text-yellow-600/80 mt-1">
              +{nodeData.regras.length - 1} condição(ões) AND
            </p>
          )}
        </div>

        {/* Handles unificados de saída com ícones Check/X */}
        <HandleWithAdd
          nodeId={id}
          handleId="sim"
          color="yellow"
          icon="check"
          top="35%"
          onAddNode={nodeData.onAddNode}
        />
        <HandleWithAdd
          nodeId={id}
          handleId="nao"
          color="yellow"
          icon="x"
          top="65%"
          onAddNode={nodeData.onAddNode}
        />
      </div>
    </div>
  )
})

CondicaoNode.displayName = 'CondicaoNode'
