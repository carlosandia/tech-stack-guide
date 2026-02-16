/**
 * AIDEV-NOTE: Página de Templates de Etapas
 * Conforme PRD-05 - Templates de Etapas do Funil
 * Lista com cor, tipo, probabilidade e proteção de sistema
 */

import { useState, useEffect } from 'react'
import { Plus, Loader2, Pencil, Lock, Layers } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import { useEtapasTemplates } from '../hooks/useEtapasTemplates'
import { EtapaTemplateFormModal } from '../components/etapas/EtapaTemplateFormModal'
import type { EtapaTemplate } from '../services/configuracoes.api'

const tipoLabelMap: Record<string, string> = {
  entrada: 'Entrada',
  normal: 'Personalizado',
  ganho: 'Ganho',
  perda: 'Perda',
}

export function EtapasTemplatesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { setActions, setSubtitle } = useConfigToolbar()

  const [modalAberto, setModalAberto] = useState(false)
  const [templateEditando, setTemplateEditando] = useState<EtapaTemplate | null>(null)

  const { data, isLoading, error } = useEtapasTemplates()

  useEffect(() => {
    setSubtitle('Modelos de etapas com tarefas pré-configuradas para utilizar nos funis de vendas')
    setActions(
      isAdmin ? (
        <button
          onClick={() => { setTemplateEditando(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Etapa</span>
        </button>
      ) : null
    )
    return () => { setActions(null); setSubtitle(null) }
  }, [isAdmin, setActions, setSubtitle])

  const handleEdit = (template: EtapaTemplate) => {
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
            <Layers className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum template de etapa encontrado</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              Clique em &quot;Nova Etapa&quot; para criar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {templates.map(template => (
            <div
              key={template.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-all duration-200 ${
                !template.ativo ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${template.cor}20` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.cor }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{template.nome}</span>
                    {template.sistema && (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {!template.ativo && (
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      template.tipo === 'ganho' ? 'bg-green-100 text-green-700' :
                      template.tipo === 'perda' ? 'bg-red-100 text-red-700' :
                      template.tipo === 'entrada' ? 'bg-blue-100 text-blue-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {tipoLabelMap[template.tipo] || template.tipo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {template.probabilidade}%
                    </span>
                    {template.tarefas && template.tarefas.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {template.tarefas.length} tarefa{template.tarefas.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && !template.sistema && template.tipo === 'normal' && (
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                    title="Editar etapa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        * Etapas com <Lock className="w-3 h-3 inline" /> são do sistema e não podem ser removidas.
      </p>

      {modalAberto && (
        <EtapaTemplateFormModal
          template={templateEditando}
          onClose={() => { setModalAberto(false); setTemplateEditando(null) }}
        />
      )}
    </div>
  )
}
