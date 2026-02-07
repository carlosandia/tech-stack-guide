/**
 * AIDEV-NOTE: Aba Atividades da configuração de pipeline
 * Conforme PRD-07 RF-07 - Tarefas automáticas por etapa
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Zap, ClipboardList } from 'lucide-react'
import { useAtividadesEtapa, useTarefasTemplatesDisponiveis, useVincularTarefaEtapa, useDesvincularTarefaEtapa } from '../../hooks/usePipelineConfig'

interface Props {
  funilId: string
}

export function ConfigAtividades({ funilId }: Props) {
  const { data: etapasComTarefas, isLoading } = useAtividadesEtapa(funilId)
  const { data: templatesTarefas } = useTarefasTemplatesDisponiveis()
  const vincular = useVincularTarefaEtapa(funilId)
  const desvincular = useDesvincularTarefaEtapa(funilId)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAddFor, setShowAddFor] = useState<string | null>(null)

  const toggleExpand = (etapaId: string) => {
    setExpanded(prev => prev === etapaId ? null : etapaId)
    setShowAddFor(null)
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Atividades Automáticas</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vincule tarefas que serão criadas automaticamente ao mover oportunidades entre etapas
        </p>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-1.5">
        {(etapasComTarefas || []).map(({ etapa, tarefas }) => (
          <div key={etapa.id} className="border border-border rounded-lg bg-card overflow-hidden">
            {/* Etapa header */}
            <button
              onClick={() => toggleExpand(etapa.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-all duration-200"
            >
              {expanded === etapa.id ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}

              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: etapa.cor || '#6B7280' }}
              />

              <span className="text-sm font-medium text-foreground flex-1 text-left">
                {etapa.nome}
              </span>

              {tarefas.length > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                  {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}
                </span>
              )}
            </button>

            {/* Conteúdo expandido */}
            {expanded === etapa.id && (
              <div className="px-3 pb-3 pt-1 border-t border-border">
                {/* Tarefas vinculadas */}
                {tarefas.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {tarefas.map(vinculo => (
                      <div
                        key={vinculo.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground flex-1">
                          {vinculo.tarefa?.titulo || 'Tarefa'}
                        </span>
                        {vinculo.tarefa?.tipo && (
                          <span className="text-xs text-muted-foreground">
                            {vinculo.tarefa.tipo}
                          </span>
                        )}
                        <button
                          onClick={() => desvincular.mutate(vinculo.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all duration-200"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    Nenhuma tarefa automática configurada
                  </p>
                )}

                {/* Botão adicionar */}
                {showAddFor !== etapa.id ? (
                  <button
                    onClick={() => setShowAddFor(etapa.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Tarefa
                  </button>
                ) : (
                  <div className="border border-border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                    {(templatesTarefas || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhum template de tarefa disponível.
                        Crie templates em Configurações &gt; Tarefas.
                      </p>
                    ) : (
                      (templatesTarefas || [])
                        .filter(t => !tarefas.some(v => v.tarefa_template_id === t.id))
                        .map(template => (
                          <button
                            key={template.id}
                            onClick={() => {
                              vincular.mutate({ etapaFunilId: etapa.id, tarefaTemplateId: template.id })
                              setShowAddFor(null)
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm transition-all duration-200"
                          >
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="flex-1 text-foreground">{template.titulo}</span>
                            <Plus className="w-3.5 h-3.5 text-primary" />
                          </button>
                        ))
                    )}
                    <button
                      onClick={() => setShowAddFor(null)}
                      className="text-xs text-muted-foreground hover:underline mt-1"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
