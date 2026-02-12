/**
 * AIDEV-NOTE: Nó customizado de Delay (azul claro)
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Timer, Trash2 } from 'lucide-react'
import { AddNodeButton } from './AddNodeButton'

export interface DelayNodeData {
  duracao?: number
  unidade?: 'minutos' | 'horas' | 'dias'
  modo_delay?: 'relativo' | 'agendado'
  data_agendada?: string
  hora_agendada?: string
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteNode?: (nodeId: string) => void
  [key: string]: unknown
}

export const DelayNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as DelayNodeData

  const isAgendado = nodeData.modo_delay === 'agendado'
  const label = isAgendado
    ? (nodeData.data_agendada
        ? `${nodeData.data_agendada}${nodeData.hora_agendada ? ` às ${nodeData.hora_agendada}` : ''}`
        : 'Agendar data/hora')
    : (nodeData.duracao
        ? `${nodeData.duracao} ${nodeData.unidade || 'minutos'}`
        : 'Configurar tempo')

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    nodeData.onDeleteNode?.(id)
  }

  return (
    <div className="flex flex-col items-center group/node">
      <div
        className={`
          relative bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-blue-400 shadow-md border-blue-400' : 'border-blue-300/60 hover:shadow-md hover:border-blue-400'}
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

        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white !-top-1.5"
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-blue-50 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
            <Timer className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Delay</p>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {label}
          </p>
        </div>

        {/* Handle de saída */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white !-bottom-1.5"
        />
      </div>

      {/* Botão + abaixo do nó */}
      <AddNodeButton nodeId={id} onAddNode={nodeData.onAddNode} />
    </div>
  )
})

DelayNode.displayName = 'DelayNode'
