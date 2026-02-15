/**
 * AIDEV-NOTE: Modal de CRUD de Segmentos
 * Conforme PRD-06 RF-006 - Gerenciar Segmentos
 * Apenas Admin pode criar/editar/excluir segmentos
 */

import { useState, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Pencil, Trash2 } from 'lucide-react'
import { useSegmentos, useCriarSegmento, useAtualizarSegmento, useExcluirSegmento } from '../hooks/useSegmentos'
import { SegmentoFormSchema, CORES_SEGMENTOS } from '../schemas/contatos.schema'
import type { SegmentoFormData } from '../schemas/contatos.schema'
import type { Segmento } from '../services/contatos.api'

interface SegmentosManagerProps {
  open: boolean
  onClose: () => void
}

export const SegmentosManager = forwardRef<HTMLDivElement, SegmentosManagerProps>(function SegmentosManager({ open, onClose }, _ref) {
  const { data } = useSegmentos()
  const criarSegmento = useCriarSegmento()
  const atualizarSegmento = useAtualizarSegmento()
  const excluirSegmento = useExcluirSegmento()

  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingSegmento, setEditingSegmento] = useState<Segmento | null>(null)

  const form = useForm<SegmentoFormData>({
    resolver: zodResolver(SegmentoFormSchema),
    defaultValues: { nome: '', cor: CORES_SEGMENTOS[0], descricao: '' },
  })

  if (!open) return null

  const segmentos = data?.segmentos || []

  const handleOpenCreate = () => {
    form.reset({ nome: '', cor: CORES_SEGMENTOS[0], descricao: '' })
    setEditingSegmento(null)
    setFormMode('create')
  }

  const handleOpenEdit = (seg: Segmento) => {
    form.reset({ nome: seg.nome, cor: seg.cor, descricao: seg.descricao || '' })
    setEditingSegmento(seg)
    setFormMode('edit')
  }

  const handleSubmit = (data: SegmentoFormData) => {
    if (formMode === 'edit' && editingSegmento) {
      atualizarSegmento.mutate(
        { id: editingSegmento.id, payload: data },
        { onSuccess: () => setFormMode('list') }
      )
    } else {
      criarSegmento.mutate(data, { onSuccess: () => setFormMode('list') })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este segmento?')) {
      excluirSegmento.mutate(id)
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-lg w-[calc(100%-32px)] sm:w-full max-w-lg max-h-[85vh] flex flex-col z-10 mx-4 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {formMode === 'list' ? 'Gerenciar Segmentos' : formMode === 'create' ? 'Novo Segmento' : 'Editar Segmento'}
          </h3>
          <button onClick={formMode === 'list' ? onClose : () => setFormMode('list')} className="p-2 hover:bg-accent rounded-md transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {formMode === 'list' ? (
            <div className="space-y-3">
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Segmento
              </button>

              {segmentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum segmento criado</p>
              ) : (
                segmentos.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cor }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{seg.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {seg.total_contatos ?? 0} contato(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenEdit(seg)} className="p-1.5 hover:bg-accent rounded-md transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(seg.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome do Segmento *</label>
                <input
                  {...form.register('nome')}
                  placeholder="Ex: Leads Qualificados"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.nome && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Cor *</label>
                <div className="flex flex-wrap gap-2">
                  {CORES_SEGMENTOS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => form.setValue('cor', cor)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.watch('cor') === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
                {form.formState.errors.cor && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.cor.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descrição (opcional)</label>
                <textarea
                  {...form.register('descricao')}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFormMode('list')} className="px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarSegmento.isPending || atualizarSegmento.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {criarSegmento.isPending || atualizarSegmento.isPending ? 'Salvando...' : 'Salvar Segmento'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {formMode === 'list' && (
          <div className="px-6 py-4 border-t border-border">
            <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
SegmentosManager.displayName = 'SegmentosManager'
