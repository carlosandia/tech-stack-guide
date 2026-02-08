/**
 * AIDEV-NOTE: Modal de confirmação para concluir tarefa (PRD-10)
 * Usa ModalBase padrão, campo opcional de observação
 */

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { ModalBase } from '@/modules/configuracoes/components/ui/ModalBase'
import type { TarefaComDetalhes } from '../services/tarefas.api'

interface ConcluirTarefaModalProps {
  tarefa: TarefaComDetalhes
  loading: boolean
  onClose: () => void
  onConfirm: (tarefaId: string, observacao?: string) => void
}

export function ConcluirTarefaModal({
  tarefa,
  loading,
  onClose,
  onConfirm,
}: ConcluirTarefaModalProps) {
  const [observacao, setObservacao] = useState('')

  const opLabel = tarefa.oportunidades
    ? `${tarefa.oportunidades.titulo || 'Sem título'}${tarefa.oportunidades.codigo ? ` #${tarefa.oportunidades.codigo}` : ''}`
    : null

  return (
    <ModalBase
      onClose={onClose}
      title="Concluir Tarefa"
      description="Marcar esta tarefa como concluída"
      icon={CheckCircle}
      variant="edit"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-accent transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tarefa.id, observacao || undefined)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Concluir Tarefa
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* Info da tarefa */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
          <p className="text-sm font-medium text-foreground">{tarefa.titulo}</p>
          {opLabel && (
            <p className="text-xs text-muted-foreground">
              Oportunidade: {opLabel}
            </p>
          )}
        </div>

        {/* Observação opcional */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Observação <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Adicione uma observação sobre a conclusão..."
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {observacao.length}/1000
          </p>
        </div>
      </div>
    </ModalBase>
  )
}
