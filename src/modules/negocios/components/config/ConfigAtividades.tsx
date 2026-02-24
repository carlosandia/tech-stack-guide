/**
 * AIDEV-NOTE: Aba Atividades da configuração de pipeline
 * Conforme PRD-07 RF-07 - Tarefas automáticas por etapa
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, Plus, X, Zap, ClipboardList, Search, Check } from 'lucide-react'
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
  const [modalEtapaId, setModalEtapaId] = useState<string | null>(null)

  const toggleExpand = (etapaId: string) => {
    setExpanded(prev => prev === etapaId ? null : etapaId)
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  const etapaModal = modalEtapaId
    ? (etapasComTarefas || []).find(e => e.etapa.id === modalEtapaId)
    : null

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
                        className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">
                            {vinculo.tarefa?.titulo || 'Tarefa'}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {vinculo.tarefa?.canal && (
                              <span className="text-xs text-muted-foreground">{vinculo.tarefa.canal}</span>
                            )}
                            {vinculo.tarefa?.prioridade && (
                              <span className={`text-xs font-medium ${
                                vinculo.tarefa.prioridade === 'alta' ? 'text-orange-500' :
                                vinculo.tarefa.prioridade === 'urgente' ? 'text-destructive' :
                                'text-primary'
                              }`}>
                                {vinculo.tarefa.prioridade.charAt(0).toUpperCase() + vinculo.tarefa.prioridade.slice(1)}
                              </span>
                            )}
                            {vinculo.tarefa?.dias_prazo != null && (
                              <span className="text-xs text-muted-foreground">
                                Prazo: {vinculo.tarefa.dias_prazo} {vinculo.tarefa.dias_prazo === 1 ? 'dia' : 'dias'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => desvincular.mutate(vinculo.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all duration-200 flex-shrink-0"
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

                {/* Botão abrir modal */}
                <button
                  onClick={() => setModalEtapaId(etapa.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Gerenciar Tarefas
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalEtapaId && etapaModal && (
        <GerenciarTarefasModal
          etapa={etapaModal.etapa}
          tarefasVinculadas={etapaModal.tarefas}
          templates={templatesTarefas || []}
          onVincular={(templateId) => vincular.mutate({ etapaFunilId: modalEtapaId, tarefaTemplateId: templateId })}
          onDesvincular={(vinculoId) => desvincular.mutate(vinculoId)}
          onClose={() => setModalEtapaId(null)}
        />
      )}
    </div>
  )
}

// =====================================================
// Modal de gerenciamento de tarefas por etapa
// =====================================================

interface GerenciarTarefasModalProps {
  etapa: { id: string; nome: string; cor?: string | null }
  tarefasVinculadas: Array<{ id: string; tarefa_template_id: string; tarefa?: any }>
  templates: Array<{ id: string; titulo: string; canal?: string | null; prioridade?: string | null; dias_prazo?: number | null }>
  onVincular: (templateId: string) => void
  onDesvincular: (vinculoId: string) => void
  onClose: () => void
}

function GerenciarTarefasModal({
  etapa,
  tarefasVinculadas,
  templates,
  onVincular,
  onDesvincular,
  onClose,
}: GerenciarTarefasModalProps) {
  const [busca, setBusca] = useState('')

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const vinculadosIds = useMemo(
    () => new Set(tarefasVinculadas.map(v => v.tarefa_template_id)),
    [tarefasVinculadas]
  )

  const templatesFiltrados = useMemo(() => {
    if (!busca.trim()) return templates
    const q = busca.toLowerCase()
    return templates.filter(t => t.titulo.toLowerCase().includes(q))
  }, [templates, busca])

  const handleToggle = (template: { id: string }) => {
    if (vinculadosIds.has(template.id)) {
      const vinculo = tarefasVinculadas.find(v => v.tarefa_template_id === template.id)
      if (vinculo) onDesvincular(vinculo.id)
    } else {
      onVincular(template.id)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Conteúdo */}
      <div className="relative z-[401] bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: etapa.cor || '#6B7280' }}
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                Tarefas — {etapa.nome}
              </h3>
              <p className="text-xs text-muted-foreground">
                Selecione as tarefas automáticas para esta etapa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar template de tarefa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de templates */}
        <div className="flex-1 overflow-y-auto p-2">
          {templatesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {templates.length === 0
                  ? 'Nenhum template de tarefa disponível. Crie templates em Configurações > Tarefas.'
                  : 'Nenhum template encontrado para a busca.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {templatesFiltrados.map(template => {
                const ativo = vinculadosIds.has(template.id)
                return (
                  <button
                    key={template.id}
                    onClick={() => handleToggle(template)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                      ativo
                        ? 'bg-primary/5 border border-primary/30'
                        : 'hover:bg-accent border border-transparent'
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      ativo
                        ? 'bg-primary text-primary-foreground'
                        : 'border-2 border-muted-foreground/30'
                    }`}>
                      {ativo && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <ClipboardList className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">
                        {template.titulo}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {template.canal && (
                          <span className="text-xs text-muted-foreground">{template.canal}</span>
                        )}
                        {template.prioridade && (
                          <span className={`text-xs font-medium ${
                            template.prioridade === 'alta' ? 'text-orange-500' :
                            template.prioridade === 'urgente' ? 'text-destructive' :
                            'text-primary'
                          }`}>
                            {template.prioridade.charAt(0).toUpperCase() + template.prioridade.slice(1)}
                          </span>
                        )}
                        {template.dias_prazo != null && (
                          <span className="text-xs text-muted-foreground">
                            Prazo: {template.dias_prazo} {template.dias_prazo === 1 ? 'dia' : 'dias'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {tarefasVinculadas.length} {tarefasVinculadas.length === 1 ? 'tarefa vinculada' : 'tarefas vinculadas'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
