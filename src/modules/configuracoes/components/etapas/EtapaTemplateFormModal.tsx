/**
 * AIDEV-NOTE: Modal de criação/edição de Template de Etapa
 * Conforme PRD-05 - Templates de Etapas do Funil
 * 4 tipos: entrada, normal, ganho, perda
 * Etapas sistema (ganho/perda) são protegidas
 */

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { etapaTemplateFormSchema, tipoEtapaOptions, coresEtapaDefault } from '../../schemas/etapas-templates.schema'
import type { EtapaTemplateFormData } from '../../schemas/etapas-templates.schema'
import { useCriarEtapaTemplate, useAtualizarEtapaTemplate, useExcluirEtapaTemplate } from '../../hooks/useEtapasTemplates'
import { useTarefasTemplates } from '../../hooks/useTarefasTemplates'
import type { EtapaTemplate } from '../../services/configuracoes.api'

interface EtapaTemplateFormModalProps {
  template?: EtapaTemplate | null
  onClose: () => void
}

export function EtapaTemplateFormModal({ template, onClose }: EtapaTemplateFormModalProps) {
  const isEditing = !!template
  const isSistema = template?.sistema
  const [confirmDelete, setConfirmDelete] = useState(false)

  const criar = useCriarEtapaTemplate()
  const atualizar = useAtualizarEtapaTemplate()
  const excluir = useExcluirEtapaTemplate()

  // Carregar tarefas disponíveis para vínculo
  const { data: tarefasData } = useTarefasTemplates({ ativo: 'true' })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EtapaTemplateFormData>({
    resolver: zodResolver(etapaTemplateFormSchema),
    defaultValues: {
      nome: template?.nome || '',
      descricao: template?.descricao || '',
      tipo: template?.tipo || 'normal',
      cor: template?.cor || '#6B7280',
      probabilidade: template?.probabilidade ?? 0,
      tarefas_ids: template?.tarefas?.map(t => t.tarefa_template_id) || [],
    },
  })

  const corSelecionada = watch('cor')
  const tipoSelecionado = watch('tipo')
  const tarefasIds = watch('tarefas_ids') || []

  const onSubmit = async (data: EtapaTemplateFormData) => {
    try {
      if (isEditing && template) {
        await atualizar.mutateAsync({ id: template.id, payload: data })
      } else {
        await criar.mutateAsync(data)
      }
      onClose()
    } catch { /* tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!template) return
    try {
      await excluir.mutateAsync(template.id)
      onClose()
    } catch { /* tratado pelo React Query */ }
  }

  const toggleTarefa = (tarefaId: string) => {
    const current = tarefasIds
    if (current.includes(tarefaId)) {
      setValue('tarefas_ids', current.filter(id => id !== tarefaId))
    } else {
      setValue('tarefas_ids', [...current, tarefaId])
    }
  }

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
            {isEditing ? (isSistema ? 'Etapa do Sistema' : 'Editar Etapa') : 'Nova Etapa'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSistema && (
          <div className="mx-6 mt-4 px-3 py-2 rounded-md bg-muted text-xs text-muted-foreground">
            Etapas do sistema não podem ser editadas ou excluídas.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              {...register('nome')}
              disabled={isSistema}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ex: Qualificação"
            />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <textarea
              {...register('descricao')}
              disabled={isSistema}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none disabled:opacity-50"
              rows={2}
              placeholder="Descrição opcional..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm font-medium text-foreground">Tipo *</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {tipoEtapaOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isSistema}
                  onClick={() => setValue('tipo', opt.value)}
                  className={`flex items-center justify-center px-2 py-2 rounded-md border text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                    tipoSelecionado === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="text-sm font-medium text-foreground">Cor</label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {coresEtapaDefault.map(cor => (
                <button
                  key={cor}
                  type="button"
                  disabled={isSistema}
                  onClick={() => setValue('cor', cor)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 disabled:opacity-50 ${
                    corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          {/* Probabilidade */}
          <div>
            <label className="text-sm font-medium text-foreground">Probabilidade (%)</label>
            <input
              type="number"
              {...register('probabilidade', { valueAsNumber: true })}
              disabled={isSistema}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
              min={0}
              max={100}
            />
            {errors.probabilidade && <p className="text-xs text-destructive mt-1">{errors.probabilidade.message}</p>}
          </div>

          {/* Tarefas vinculadas */}
          {!isSistema && tarefasData?.templates && tarefasData.templates.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground">Tarefas automáticas</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Selecione as tarefas criadas automaticamente ao entrar nesta etapa
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tarefasData.templates.map(tarefa => (
                  <label
                    key={tarefa.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/30 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={tarefasIds.includes(tarefa.id)}
                      onChange={() => toggleTarefa(tarefa.id)}
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="text-sm text-foreground">{tarefa.titulo}</span>
                    <span className="text-xs text-muted-foreground capitalize">{tarefa.tipo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {isEditing && !isSistema && !confirmDelete && (
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
                  <button type="button" onClick={handleDelete} disabled={excluir.isPending} className="text-sm font-medium text-destructive">Sim</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-muted-foreground">Não</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-9 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition-all duration-200"
              >
                {isSistema ? 'Fechar' : 'Cancelar'}
              </button>
              {!isSistema && (
                <button
                  type="submit"
                  disabled={isSubmitting || criar.isPending || atualizar.isPending}
                  className="flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                >
                  {(isSubmitting || criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditing ? 'Salvar' : 'Criar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
