/**
 * AIDEV-NOTE: Nó customizado de Validação (roxo/violeta) com handles horizontais
 * 2 saídas à direita (Match / Nenhuma)
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ShieldCheck, Trash2, Check, X } from 'lucide-react'
import { VALIDACAO_OPERADORES } from '../../schemas/automacoes.schema'
import { AddNodeButton } from './AddNodeButton'

export interface ValidacaoNodeData {
  condicoes?: Array<{ operador?: string; tipo_conteudo?: string; valor?: string }>
  onAddNode?: (type: 'acao' | 'condicao' | 'delay' | 'validacao', sourceNodeId: string, sourceHandle?: string) => void
  onDeleteNode?: (nodeId: string) => void
  [key: string]: unknown
}

export const ValidacaoNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as ValidacaoNodeData
  const condicoes = nodeData.condicoes || []
  const primeiraCondicao = condicoes[0]
  const operadorInfo = primeiraCondicao?.operador
    ? VALIDACAO_OPERADORES.find(o => o.value === primeiraCondicao.operador)
    : null

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
          ${selected ? 'ring-2 ring-violet-500 shadow-md border-violet-500' : 'border-violet-400/60 hover:shadow-md hover:border-violet-500'}
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
          className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white !-left-1.5"
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

        {/* Handles de saída com ícones Check/X */}
        <Handle
          type="source"
          position={Position.Right}
          id="match"
          className="!w-0 !h-0 !bg-transparent !border-0 !-right-1.5"
          style={{ top: '35%' }}
        />
        <div className="absolute pointer-events-none" style={{ top: '35%', right: -10, transform: 'translateY(-50%)' }}>
          <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="nenhuma"
          className="!w-0 !h-0 !bg-transparent !border-0 !-right-1.5"
          style={{ top: '65%' }}
        />
        <div className="absolute pointer-events-none" style={{ top: '65%', right: -10, transform: 'translateY(-50%)' }}>
          <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-sm">
            <X className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      {/* Botões + para cada branch à direita */}
      <div className="flex flex-col gap-8 ml-0">
        <AddNodeButton nodeId={id} sourceHandle="match" onAddNode={nodeData.onAddNode} />
        <AddNodeButton nodeId={id} sourceHandle="nenhuma" onAddNode={nodeData.onAddNode} />
      </div>
    </div>
  )
})

ValidacaoNode.displayName = 'ValidacaoNode'
