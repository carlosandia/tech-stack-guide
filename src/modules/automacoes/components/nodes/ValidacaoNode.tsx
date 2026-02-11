/**
 * AIDEV-NOTE: Nó customizado de Validação (roxo/violeta) com 2 saídas (Match / Nenhuma)
 * Avalia conteúdo textual de respostas de mensagens
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ShieldCheck } from 'lucide-react'
import { VALIDACAO_OPERADORES } from '../../schemas/automacoes.schema'
import { AddNodeButton } from './AddNodeButton'

export interface ValidacaoNodeData {
  condicoes?: Array<{ operador?: string; tipo_conteudo?: string; valor?: string }>
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  [key: string]: unknown
}

export const ValidacaoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as ValidacaoNodeData
  const condicoes = nodeData.condicoes || []
  const primeiraCondicao = condicoes[0]
  const operadorInfo = primeiraCondicao?.operador
    ? VALIDACAO_OPERADORES.find(o => o.value === primeiraCondicao.operador)
    : null

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          bg-white rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-violet-500 shadow-md border-violet-500' : 'border-violet-400/60 hover:shadow-md hover:border-violet-500'}
        `}
      >
        {/* Handle de entrada */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white !-top-1.5"
        />

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-violet-50 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">Validação</p>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate">
            {operadorInfo?.label || 'Configurar validação'}
          </p>
          {condicoes.length > 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              +{condicoes.length - 1} regra{condicoes.length > 2 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Labels de saída — Match (esquerda), Nenhuma (direita) */}
        <div className="flex justify-between px-4 pb-2">
          <span className="text-[10px] font-medium text-green-600">Match</span>
          <span className="text-[10px] font-medium text-red-500">Nenhuma</span>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="match"
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !-bottom-1.5"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="nenhuma"
          className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !-bottom-1.5"
          style={{ left: '70%' }}
        />
      </div>

      {/* Botões + para cada branch */}
      <div className="flex gap-16 mt-0">
        <AddNodeButton nodeId={id} sourceHandle="match" onAddNode={nodeData.onAddNode} />
        <AddNodeButton nodeId={id} sourceHandle="nenhuma" onAddNode={nodeData.onAddNode} />
      </div>
    </div>
  )
})

ValidacaoNode.displayName = 'ValidacaoNode'
