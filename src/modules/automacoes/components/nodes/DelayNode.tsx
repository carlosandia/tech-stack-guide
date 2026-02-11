/**
 * AIDEV-NOTE: Nó customizado de Delay (azul claro)
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Timer } from 'lucide-react'
import { AddNodeButton } from './AddNodeButton'

export interface DelayNodeData {
  duracao?: number
  unidade?: 'minutos' | 'horas' | 'dias'
  modo_delay?: 'relativo' | 'agendado'
  data_agendada?: string
  hora_agendada?: string
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
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

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-blue-400 shadow-md border-blue-400' : 'border-blue-300/60 hover:shadow-md hover:border-blue-400'}
        `}
      >
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
