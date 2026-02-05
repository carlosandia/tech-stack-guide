/**
 * AIDEV-NOTE: Página de Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas
 * Lista com ícone por tipo, prioridade e prazo
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Pencil, Phone, Mail, Calendar, MessageCircle, MapPin, CheckSquare } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useTarefasTemplates } from '../hooks/useTarefasTemplates'
import { TarefaTemplateFormModal } from '../components/tarefas/TarefaTemplateFormModal'
import { prioridadeTarefaOptions } from '../schemas/tarefas-templates.schema'
import type { TarefaTemplate } from '../services/configuracoes.api'

const tipoIconMap: Record<string, typeof Phone> = {
  ligacao: Phone,
  email: Mail,
  reuniao: Calendar,
  whatsapp: MessageCircle,
  visita: MapPin,
  outro: CheckSquare,
}

const tipoLabelMap: Record<string, string> = {
  ligacao: 'Ligação',
  email: 'E-mail',
  reuniao: 'Reunião',
  whatsapp: 'WhatsApp',
  visita: 'Visita',
  outro: 'Outro',
}

export function TarefasTemplatesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalAberto, setModalAberto] = useState(false)
  const [templateEditando, setTemplateEditando] = useState<TarefaTemplate | null>(null)

  const { data, isLoading, error } = useTarefasTemplates()

  useEffect(() => {
    setSubtitle('Tarefas disponíveis para vincular nas etapas da pipeline')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setTemplateEditando(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (template: TarefaTemplate) => {
    if (!isAdmin) return
    setTemplateEditando(template)
    setModalAberto(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">Erro ao carregar templates</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Verifique sua conexão'}
        </p>
      </div>
    )
  }

  const templates = data?.templates || []

  return (
    <div className="space-y-6">
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum template de tarefa encontrado</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Tarefa&quot; para criar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {templates.map(template => {
            const Icon = tipoIconMap[template.tipo] || CheckSquare
            const prioridade = prioridadeTarefaOptions.find(p => p.value === template.prioridade)

            return (
              <div
                key={template.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
                  !template.ativo ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{template.titulo}</span>
                      {!template.ativo && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {tipoLabelMap[template.tipo] || template.tipo}
                      </span>
                      <span className="text-xs" style={{ color: prioridade?.cor || '#6B7280' }}>
                        {prioridade?.label || template.prioridade}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Prazo: {template.dias_prazo} {template.dias_prazo === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar template"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <TarefaTemplateFormModal
          template={templateEditando}
          onClose={() => { setModalAberto(false); setTemplateEditando(null) }}
        />
      )}
    </div>
  )
}
