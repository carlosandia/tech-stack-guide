/**
 * AIDEV-NOTE: Modal de criar/editar equipe
 * Migrado para usar ModalBase (Design System 10.5)
 * confirm() nativo substituído por confirmação inline
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Users, Trash2 } from 'lucide-react'
import { useCriarEquipe, useAtualizarEquipe, useExcluirEquipe } from '../../hooks/useEquipe'
import { criarEquipeSchema, coresEquipe, type CriarEquipeForm } from '../../schemas/equipe.schema'
import type { EquipeComMembros } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface Props {
  equipe?: EquipeComMembros | null
  onClose: () => void
}

export function EquipeFormModal({ equipe, onClose }: Props) {
  const isEdicao = !!equipe
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const criar = useCriarEquipe()
  const atualizar = useAtualizarEquipe()
  const excluir = useExcluirEquipe()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CriarEquipeForm>({
    resolver: zodResolver(criarEquipeSchema),
    defaultValues: equipe
      ? { nome: equipe.nome, descricao: equipe.descricao || '', cor: equipe.cor || undefined }
      : { nome: '', descricao: '' },
  })

  const corSelecionada = watch('cor')

  const onSubmit = async (formData: CriarEquipeForm) => {
    try {
      if (isEdicao) { await atualizar.mutateAsync({ id: equipe!.id, payload: formData }) }
      else { await criar.mutateAsync(formData) }
      onClose()
    } catch (err) { console.error('Erro ao salvar equipe:', err) }
  }

  const handleExcluir = async () => {
    if (!equipe) return
    try { await excluir.mutateAsync(equipe.id); onClose() }
    catch (err) { console.error('Erro ao excluir equipe:', err) }
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEdicao && (
          showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Confirmar exclusão?</span>
              <button type="button" onClick={handleExcluir} disabled={excluir.isPending}
                className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200">
                {excluir.isPending ? 'Excluindo...' : 'Sim'}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)}
                className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200">Não</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
        <button type="submit" form="equipe-form" disabled={isSubmitting}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdicao ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEdicao ? 'Editar Equipe' : 'Nova Equipe'} description="Gestão de Equipes" icon={Users} variant={isEdicao ? 'edit' : 'create'} size="sm" footer={footerContent}>
      <form id="equipe-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        <div>
          <label htmlFor="eq-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="eq-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: Vendas SP" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="eq-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="eq-desc" {...register('descricao')} rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none"
            placeholder="Descrição opcional da equipe" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cor</label>
          <div className="flex flex-wrap gap-2">
            {coresEquipe.map(cor => (
              <button key={cor} type="button" onClick={() => setValue('cor', cor)}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: cor }} />
            ))}
          </div>
        </div>
      </form>
    </ModalBase>
  )
}
