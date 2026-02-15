/**
 * AIDEV-NOTE: Lista paginada de tarefas (PRD-10)
 * Inclui: loading skeleton, empty state, paginação
 */

import { forwardRef } from 'react'
import { CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { TarefaItem } from './TarefaItem'
import type { TarefaComDetalhes } from '../services/tarefas.api'

interface TarefasListProps {
  tarefas: TarefaComDetalhes[]
  isLoading: boolean
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onConcluir: (tarefa: TarefaComDetalhes) => void
  onClickOportunidade: (oportunidadeId: string) => void
  hasFiltros: boolean
}

const SkeletonItem = forwardRef<HTMLDivElement>(function SkeletonItem(_props, _ref) {
  return (
    <div className="flex items-start gap-3 px-3 sm:px-4 py-3 border-b border-border animate-pulse">
      <div className="w-5 h-5 rounded-full bg-muted mt-0.5" />
      <div className="w-8 h-8 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
    </div>
  )
})
SkeletonItem.displayName = 'SkeletonItem'

export const TarefasList = forwardRef<HTMLDivElement, TarefasListProps>(function TarefasList({
  tarefas,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  onConcluir,
  onClickOportunidade,
  hasFiltros,
}: TarefasListProps, _ref) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg mx-3 sm:mx-4 lg:mx-6 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <SkeletonItem key={i} />
        ))}
      </div>
    )
  }

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <CheckSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Nenhuma tarefa encontrada
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {hasFiltros
            ? 'Tente ajustar os filtros para encontrar as tarefas desejadas.'
            : 'Quando tarefas forem criadas nas oportunidades, elas aparecerão aqui.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-3 sm:px-4 lg:px-6 pb-4">
      {/* Lista */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {tarefas.map(tarefa => (
          <TarefaItem
            key={tarefa.id}
            tarefa={tarefa}
            onConcluir={onConcluir}
            onClickOportunidade={onClickOportunidade}
          />
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {total} tarefa{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
TarefasList.displayName = 'TarefasList'
