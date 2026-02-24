/**
 * AIDEV-NOTE: Modal de criação/edição de Template de Etapa
 * Migrado para usar ModalBase (Design System 10.5)
 * Protege exclusão de etapas vinculadas a pipelines
 */

import { useState } from 'react'
import { Loader2, Link2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { etapaTemplateFormSchema, tipoEtapaOptions, coresEtapaDefault } from '../../schemas/etapas-templates.schema'
import type { EtapaTemplateFormData } from '../../schemas/etapas-templates.schema'
import { useCriarEtapaTemplate, useAtualizarEtapaTemplate, useExcluirEtapaTemplate } from '../../hooks/useEtapasTemplates'
import { useTarefasTemplates } from '../../hooks/useTarefasTemplates'
import { useVinculosPipelines } from '../../hooks/useVinculosPipelines'
import type { EtapaTemplate } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface EtapaTemplateFormModalProps {
  template?: EtapaTemplate | null
  onClose: () => void
}

export function EtapaTemplateFormModal({ template, onClose }: EtapaTemplateFormModalProps) {
  const isEditing = !!template
  const isTipoSistema = template?.tipo === 'entrada' || template?.tipo === 'ganho' || template?.tipo === 'perda'
  const isProtegido = !!template?.sistema || isTipoSistema
  const [confirmDelete, setConfirmDelete] = useState(false)

  const criar = useCriarEtapaTemplate()
  const atualizar = useAtualizarEtapaTemplate()
  const excluir = useExcluirEtapaTemplate()
  const { data: tarefasData } = useTarefasTemplates({ ativo: 'true' })

  // AIDEV-NOTE: Buscar vínculos com pipelines para bloquear exclusão
  const { data: vinculos = [] } = useVinculosPipelines('etapa', template?.id)
  const temVinculos = vinculos.length > 0

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<EtapaTemplateFormData>({
    resolver: zodResolver(etapaTemplateFormSchema),
    defaultValues: {
      nome: template?.nome || '', descricao: template?.descricao || '',
      tipo: isEditing ? (template?.tipo || 'normal') : 'normal',
      cor: template?.cor || '#6B7280',
      probabilidade: template?.probabilidade ?? 0,
      tarefas_ids: template?.tarefas?.map(t => t.tarefa_template_id) || [],
    },
  })

  const corSelecionada = watch('cor')
  const tipoSelecionado = watch('tipo')
  const tarefasIds = watch('tarefas_ids') || []

  const tiposDisponiveis = isEditing
    ? tipoEtapaOptions
    : tipoEtapaOptions.filter(opt => opt.value === 'normal')

  const onSubmit = async (data: EtapaTemplateFormData) => {
    try {
      if (isEditing && template) { await atualizar.mutateAsync({ id: template.id, payload: data }) }
      else { await criar.mutateAsync(data) }
      onClose()
    } catch { /* tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!template) return
    try { await excluir.mutateAsync(template.id); onClose() } catch { /* tratado pelo React Query */ }
  }

  const toggleTarefa = (tarefaId: string) => {
    const current = tarefasIds
    if (current.includes(tarefaId)) { setValue('tarefas_ids', current.filter(id => id !== tarefaId)) }
    else { setValue('tarefas_ids', [...current, tarefaId]) }
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && !isProtegido && (
          temVinculos ? (
            <div className="flex items-center gap-1.5 px-3 h-9 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>Vinculado a {vinculos.length} pipeline(s)</span>
            </div>
          ) : confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Confirmar?</span>
              <button type="button" onClick={handleDelete} disabled={excluir.isPending} className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200">{excluir.isPending ? 'Excluindo...' : 'Sim'}</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200">Não</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200">Excluir</button>
          )
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">{isProtegido ? 'Fechar' : 'Cancelar'}</button>
        {!isProtegido && (
          <button type="submit" form="etapa-tpl-form" disabled={isSubmitting || criar.isPending || atualizar.isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
            {(isSubmitting || criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? (isProtegido ? 'Etapa do Sistema' : 'Editar Etapa') : 'Nova Etapa'} description="Templates de Etapas" variant={isEditing ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="etapa-tpl-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        {/* Badge de vínculos */}
        {isEditing && temVinculos && (
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Vinculado a {vinculos.length} pipeline(s)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {vinculos.map(v => v.funil_nome).join(', ')}. Desvincule de todas as pipelines antes de excluir.
            </p>
          </div>
        )}

        {isProtegido && (
          <div className="px-3 py-2 rounded-md bg-muted text-xs text-muted-foreground">
            Etapas do sistema (Entrada, Ganho, Perda) são únicas por organização e não podem ser editadas ou excluídas.
          </div>
        )}

        {/* Nome */}
        <div>
          <label htmlFor="et-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="et-nome" {...register('nome')} disabled={isProtegido}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ex: Qualificação" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="et-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="et-desc" {...register('descricao')} disabled={isProtegido}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none disabled:opacity-50"
            rows={2} placeholder="Descrição opcional..." />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tipo <span className="text-destructive">*</span></label>
          <div className={`grid gap-2 ${tiposDisponiveis.length === 1 ? 'grid-cols-1' : 'grid-cols-4'}`}>
            {tiposDisponiveis.map(opt => (
              <button key={opt.value} type="button" disabled={isProtegido} onClick={() => setValue('tipo', opt.value)}
                className={`flex items-center justify-center px-2 py-2.5 rounded-md border text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  tipoSelecionado === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {!isEditing && (
            <p className="text-xs text-muted-foreground mt-1">Etapas de Entrada, Ganho e Perda são criadas automaticamente com a organização.</p>
          )}
        </div>

        {/* Cor */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cor</label>
          <div className="flex items-center gap-2 flex-wrap">
            {coresEtapaDefault.map(cor => (
              <button key={cor} type="button" disabled={isProtegido} onClick={() => setValue('cor', cor)}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-200 disabled:opacity-50 ${
                  corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                }`} style={{ backgroundColor: cor }} />
            ))}
          </div>
        </div>

        {/* Probabilidade */}
        <div>
          <label htmlFor="et-prob" className="block text-sm font-medium text-foreground mb-1">Probabilidade (%)</label>
          <input id="et-prob" type="number" {...register('probabilidade', { valueAsNumber: true })} disabled={isProtegido}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
            min={0} max={100} aria-invalid={!!errors.probabilidade} />
          {errors.probabilidade && <p className="text-xs text-destructive mt-1">{errors.probabilidade.message}</p>}
        </div>

        {/* Tarefas vinculadas */}
        {!isProtegido && tarefasData?.templates && tarefasData.templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tarefas automáticas</label>
            <p className="text-xs text-muted-foreground mb-2">Selecione as tarefas criadas automaticamente ao entrar nesta etapa</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {tarefasData.templates.map(tarefa => (
                <label key={tarefa.id} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/30 cursor-pointer transition-all duration-200">
                  <input type="checkbox" checked={tarefasIds.includes(tarefa.id)} onChange={() => toggleTarefa(tarefa.id)} className="rounded border-input text-primary focus:ring-ring" />
                  <span className="text-sm text-foreground">{tarefa.titulo}</span>
                  <span className="text-xs text-muted-foreground capitalize">{tarefa.tipo}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
