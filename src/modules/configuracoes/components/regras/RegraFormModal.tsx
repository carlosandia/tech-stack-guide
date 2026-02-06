/**
 * AIDEV-NOTE: Modal de criação/edição de Regra de Qualificação (MQL)
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { regraFormSchema, operadorOptions } from '../../schemas/regras.schema'
import type { RegraFormData } from '../../schemas/regras.schema'
import { useCriarRegra, useAtualizarRegra, useExcluirRegra } from '../../hooks/useRegras'
import { useCampos } from '../../hooks/useCampos'
import type { RegraQualificacao } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface RegraFormModalProps {
  regra?: RegraQualificacao | null
  onClose: () => void
}

export function RegraFormModal({ regra, onClose }: RegraFormModalProps) {
  const isEditing = !!regra
  const [confirmDelete, setConfirmDelete] = useState(false)

  const criar = useCriarRegra()
  const atualizar = useAtualizarRegra()
  const excluir = useExcluirRegra()
  const { data: camposData } = useCampos('contato')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegraFormData>({
    resolver: zodResolver(regraFormSchema),
    defaultValues: {
      nome: regra?.nome || '', descricao: regra?.descricao || '',
      campo_id: regra?.campo_id || '', operador: regra?.operador || 'igual',
      valor: regra?.valor || '', valores: regra?.valores || [],
    },
  })

  const operadorSelecionado = watch('operador')
  const precisaValor = !['vazio', 'nao_vazio'].includes(operadorSelecionado)

  const onSubmit = async (data: RegraFormData) => {
    try {
      if (isEditing && regra) { await atualizar.mutateAsync({ id: regra.id, payload: data }) }
      else { await criar.mutateAsync(data) }
      onClose()
    } catch { /* tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!regra) return
    try { await excluir.mutateAsync(regra.id); onClose() } catch { /* tratado pelo React Query */ }
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
        <button type="submit" form="regra-form" disabled={isSubmitting || criar.isPending || atualizar.isPending}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
          {(isSubmitting || criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Regra' : 'Nova Regra de Qualificação'} description="Qualificação MQL" variant={isEditing ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="regra-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        <div>
          <label htmlFor="rg-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="rg-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: Email corporativo" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="rg-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="rg-desc" {...register('descricao')} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none" rows={2} placeholder="Descrição opcional da regra..." />
        </div>

        <div>
          <label htmlFor="rg-campo" className="block text-sm font-medium text-foreground mb-1">Campo <span className="text-destructive">*</span></label>
          <select id="rg-campo" {...register('campo_id')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" aria-invalid={!!errors.campo_id}>
            <option value="">Selecione um campo...</option>
            {camposData?.campos?.map(campo => (<option key={campo.id} value={campo.id}>{campo.nome} ({campo.tipo})</option>))}
          </select>
          {errors.campo_id && <p className="text-xs text-destructive mt-1">{errors.campo_id.message}</p>}
        </div>

        <div>
          <label htmlFor="rg-operador" className="block text-sm font-medium text-foreground mb-1">Operador <span className="text-destructive">*</span></label>
          <select id="rg-operador" {...register('operador')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
            {operadorOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          {errors.operador && <p className="text-xs text-destructive mt-1">{errors.operador.message}</p>}
        </div>

        {precisaValor && (
          <div>
            <label htmlFor="rg-valor" className="block text-sm font-medium text-foreground mb-1">Valor</label>
            <input id="rg-valor" {...register('valor')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: gmail.com, hotmail.com" />
            <p className="text-xs text-muted-foreground mt-1">Para múltiplos valores, separe por vírgula</p>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
