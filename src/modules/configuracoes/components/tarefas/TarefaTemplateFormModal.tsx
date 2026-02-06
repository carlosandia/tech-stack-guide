/**
 * AIDEV-NOTE: Modal de criação/edição de Template de Tarefa
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tarefaTemplateFormSchema, tipoTarefaOptions, canalTarefaOptions, prioridadeTarefaOptions } from '../../schemas/tarefas-templates.schema'
import type { TarefaTemplateFormData } from '../../schemas/tarefas-templates.schema'
import { useCriarTarefaTemplate, useAtualizarTarefaTemplate, useExcluirTarefaTemplate } from '../../hooks/useTarefasTemplates'
import type { TarefaTemplate } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

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

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TarefaTemplateFormData>({
    resolver: zodResolver(tarefaTemplateFormSchema),
    defaultValues: {
      titulo: template?.titulo || '', descricao: template?.descricao || '',
      tipo: template?.tipo || 'ligacao',
      canal: template?.canal as TarefaTemplateFormData['canal'] || undefined,
      prioridade: template?.prioridade || 'media',
      dias_prazo: template?.dias_prazo ?? 1,
    },
  })

  const tipoSelecionado = watch('tipo')

  const onSubmit = async (data: TarefaTemplateFormData) => {
    try {
      if (isEditing && template) { await atualizar.mutateAsync({ id: template.id, payload: data }) }
      else { await criar.mutateAsync(data) }
      onClose()
    } catch { /* erro tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!template) return
    try { await excluir.mutateAsync(template.id); onClose() } catch { /* erro tratado pelo React Query */ }
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && !confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200">Excluir</button>
        )}
        {confirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-destructive">Confirmar?</span>
            <button type="button" onClick={handleDelete} disabled={excluir.isPending} className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200">{excluir.isPending ? 'Excluindo...' : 'Sim'}</button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200">Não</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
        <button type="submit" form="tarefa-tpl-form" disabled={isSubmitting || criar.isPending || atualizar.isPending}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
          {(isSubmitting || criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Template' : 'Novo Template de Tarefa'} description="Templates" variant={isEditing ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="tarefa-tpl-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        {/* Título */}
        <div>
          <label htmlFor="tt-titulo" className="block text-sm font-medium text-foreground mb-1">Título <span className="text-destructive">*</span></label>
          <input id="tt-titulo" {...register('titulo')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: Ligação de qualificação" aria-invalid={!!errors.titulo} />
          {errors.titulo && <p className="text-xs text-destructive mt-1">{errors.titulo.message}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="tt-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="tt-desc" {...register('descricao')} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none" rows={2} placeholder="Descrição opcional..." />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tipo <span className="text-destructive">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            {tipoTarefaOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setValue('tipo', opt.value)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border text-sm font-medium transition-all duration-200 ${
                  tipoSelecionado === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo.message}</p>}
        </div>

        {/* Canal */}
        <div>
          <label htmlFor="tt-canal" className="block text-sm font-medium text-foreground mb-1">Canal</label>
          <select id="tt-canal" {...register('canal')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
            <option value="">Nenhum</option>
            {canalTarefaOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>

        {/* Prioridade e Dias prazo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tt-prioridade" className="block text-sm font-medium text-foreground mb-1">Prioridade</label>
            <select id="tt-prioridade" {...register('prioridade')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              {prioridadeTarefaOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="tt-prazo" className="block text-sm font-medium text-foreground mb-1">Prazo (dias)</label>
            <input id="tt-prazo" type="number" {...register('dias_prazo', { valueAsNumber: true })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" min={0} aria-invalid={!!errors.dias_prazo} />
            {errors.dias_prazo && <p className="text-xs text-destructive mt-1">{errors.dias_prazo.message}</p>}
          </div>
        </div>
      </form>
    </ModalBase>
  )
}
