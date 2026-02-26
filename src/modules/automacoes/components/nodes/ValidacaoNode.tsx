/**
 * AIDEV-NOTE: Nó customizado de Validação (roxo/violeta) com handles horizontais
 * 2 saídas à direita (Match / Nenhuma)
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ShieldCheck, Trash2 } from 'lucide-react'
import { VALIDACAO_OPERADORES } from '../../schemas/automacoes.schema'
import { HandleWithAdd } from './HandleWithAdd'

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
          relative bg-card rounded-lg border-2 shadow-sm min-w-[220px] max-w-[280px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-violet-500 shadow-md border-violet-500' : 'border-violet-400/60 hover:shadow-md hover:border-violet-500'}
        `}
      >
        {/* Botão excluir */}
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-card border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/node:opacity-100 hover:bg-destructive hover:border-destructive hover:text-white text-muted-foreground transition-all duration-200 z-10"
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
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-violet-500/10 rounded-t-lg">
          <div className="w-7 h-7 rounded-md bg-violet-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-xs font-medium text-violet-500 uppercase tracking-wide">Validação</p>
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

        {/* Handles unificados de saída com ícones Check/X */}
        <HandleWithAdd
          nodeId={id}
          handleId="match"
          color="violet"
          icon="check"
          top="35%"
          onAddNode={nodeData.onAddNode}
        />
        <HandleWithAdd
          nodeId={id}
          handleId="nenhuma"
          color="violet"
          icon="x"
          top="65%"
          onAddNode={nodeData.onAddNode}
        />
      </div>
    </div>
  )
})

ValidacaoNode.displayName = 'ValidacaoNode'
