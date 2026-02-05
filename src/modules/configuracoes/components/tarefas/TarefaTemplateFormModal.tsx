/**
 * AIDEV-NOTE: Modal de criação/edição de Template de Tarefa
 * Conforme PRD-05 - Templates de Tarefas
 * 6 tipos: ligacao, email, reuniao, whatsapp, visita, outro
 */

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tarefaTemplateFormSchema, tipoTarefaOptions, canalTarefaOptions, prioridadeTarefaOptions } from '../../schemas/tarefas-templates.schema'
import type { TarefaTemplateFormData } from '../../schemas/tarefas-templates.schema'
import { useCriarTarefaTemplate, useAtualizarTarefaTemplate, useExcluirTarefaTemplate } from '../../hooks/useTarefasTemplates'
import type { TarefaTemplate } from '../../services/configuracoes.api'

interface TarefaTemplateFormModalProps {
  template?: TarefaTemplate | null
  onClose: () => void
}

export function TarefaTemplateFormModal({ template, onClose }: TarefaTemplateFormModalProps) {
  const isEditing = !!template
  const [confirmDelete, setConfirmDelete] = useState(false)

  const criar = useCriarTarefaTemplate()
  const atualizar = useAtualizarTarefaTemplate()
  const excluir = useExcluirTarefaTemplate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TarefaTemplateFormData>({
    resolver: zodResolver(tarefaTemplateFormSchema),
    defaultValues: {
      titulo: template?.titulo || '',
      descricao: template?.descricao || '',
      tipo: template?.tipo || 'ligacao',
      canal: template?.canal as TarefaTemplateFormData['canal'] || undefined,
      prioridade: template?.prioridade || 'media',
      dias_prazo: template?.dias_prazo ?? 1,
    },
  })

  const tipoSelecionado = watch('tipo')

  const onSubmit = async (data: TarefaTemplateFormData) => {
    try {
      if (isEditing && template) {
        await atualizar.mutateAsync({ id: template.id, payload: data })
      } else {
        await criar.mutateAsync(data)
      }
      onClose()
    } catch { /* erro tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!template) return
    try {
      await excluir.mutateAsync(template.id)
      onClose()
    } catch { /* erro tratado pelo React Query */ }
  }

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Editar Template' : 'Novo Template de Tarefa'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="text-sm font-medium text-foreground">Título *</label>
            <input
              {...register('titulo')}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
              placeholder="Ex: Ligação de qualificação"
            />
            {errors.titulo && <p className="text-xs text-destructive mt-1">{errors.titulo.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <textarea
              {...register('descricao')}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none"
              rows={2}
              placeholder="Descrição opcional..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm font-medium text-foreground">Tipo *</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {tipoTarefaOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('tipo', opt.value)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200 ${
                    tipoSelecionado === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo.message}</p>}
          </div>

          {/* Canal */}
          <div>
            <label className="text-sm font-medium text-foreground">Canal</label>
            <select
              {...register('canal')}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
            >
              <option value="">Nenhum</option>
              {canalTarefaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Prioridade e Dias prazo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <select
                {...register('prioridade')}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
              >
                {prioridadeTarefaOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Prazo (dias)</label>
              <input
                type="number"
                {...register('dias_prazo', { valueAsNumber: true })}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                min={0}
              />
              {errors.dias_prazo && <p className="text-xs text-destructive mt-1">{errors.dias_prazo.message}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {isEditing && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-destructive hover:text-destructive/80 transition-all duration-200"
                >
                  Excluir
                </button>
              )}
              {confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Confirmar?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={excluir.isPending}
                    className="text-sm font-medium text-destructive hover:text-destructive/80"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Não
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-9 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || criar.isPending || atualizar.isPending}
                className="flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {(isSubmitting || criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
