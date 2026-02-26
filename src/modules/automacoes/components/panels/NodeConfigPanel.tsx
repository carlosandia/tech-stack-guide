/**
 * AIDEV-NOTE: Painel lateral direito para editar nó selecionado
 * Abre ao clicar em um nó no canvas
 */

import { useRef, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { Node } from '@xyflow/react'
import { TriggerConfig } from './TriggerConfig'
import { AcaoConfig } from './AcaoConfig'
import { CondicaoConfig } from './CondicaoConfig'
import { DelayConfig } from './DelayConfig'
import { ValidacaoConfig } from './ValidacaoConfig'

interface NodeConfigPanelProps {
  node: Node
  onClose: () => void
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void
  onDelete: (nodeId: string) => void
}

export function NodeConfigPanel({ node, onClose, onUpdate, onDelete }: NodeConfigPanelProps) {
  const isTrigger = node.type === 'trigger'

  // AIDEV-NOTE: Ref pattern para handleUpdate estável — evita stale closure e re-renders cascata
  const nodeIdRef = useRef(node.id)
  nodeIdRef.current = node.id
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const handleUpdate = useCallback((data: Record<string, unknown>) => {
    onUpdateRef.current(nodeIdRef.current, data)
  }, [])

  return (
    <aside className="w-80 flex-shrink-0 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {node.type === 'trigger' ? 'Gatilho' :
           node.type === 'condicao' ? 'Condição' :
           node.type === 'acao' ? 'Ação' :
           node.type === 'delay' ? 'Delay' :
           node.type === 'validacao' ? 'Validação' : 'Nó'}
        </h3>
        <div className="flex items-center gap-1">
          {!isTrigger && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir nó"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {node.type === 'trigger' && (
          <TriggerConfig data={node.data as Record<string, unknown>} onUpdate={handleUpdate} />
        )}
        {node.type === 'acao' && (
          <AcaoConfig data={node.data as Record<string, unknown>} onUpdate={handleUpdate} />
        )}
        {node.type === 'condicao' && (
          <CondicaoConfig data={node.data as Record<string, unknown>} onUpdate={handleUpdate} />
        )}
        {node.type === 'delay' && (
          <DelayConfig data={node.data as Record<string, unknown>} onUpdate={handleUpdate} />
        )}
        {node.type === 'validacao' && (
          <ValidacaoConfig data={node.data as Record<string, unknown>} onUpdate={handleUpdate} />
        )}
      </div>
    </aside>
  )
}
