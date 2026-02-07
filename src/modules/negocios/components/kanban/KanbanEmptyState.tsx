/**
 * AIDEV-NOTE: Estado vazio do Kanban
 * Exibido quando não há pipelines criadas
 */

import { Briefcase, Plus } from 'lucide-react'

interface KanbanEmptyStateProps {
  onCriarPipeline: () => void
}

export function KanbanEmptyState({ onCriarPipeline }: KanbanEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Nenhum pipeline criado
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Crie seu primeiro pipeline de vendas para começar a gerenciar seus negócios visualmente.
        </p>
        <button
          onClick={onCriarPipeline}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Criar Pipeline
        </button>
      </div>
    </div>
  )
}
