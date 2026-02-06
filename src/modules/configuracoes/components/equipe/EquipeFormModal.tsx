/**
 * AIDEV-NOTE: Modal de criar/editar equipe
 * Conforme PRD-05 - Gestão de Equipes
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Users } from 'lucide-react'
import { useCriarEquipe, useAtualizarEquipe, useExcluirEquipe } from '../../hooks/useEquipe'
import { criarEquipeSchema, coresEquipe, type CriarEquipeForm } from '../../schemas/equipe.schema'
import type { EquipeComMembros } from '../../services/configuracoes.api'

interface Props {
  equipe?: EquipeComMembros | null
  onClose: () => void
}

export function EquipeFormModal({ equipe, onClose }: Props) {
  const isEdicao = !!equipe
  const criar = useCriarEquipe()
  const atualizar = useAtualizarEquipe()
  const excluir = useExcluirEquipe()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CriarEquipeForm>({
    resolver: zodResolver(criarEquipeSchema),
    defaultValues: equipe
      ? { nome: equipe.nome, descricao: equipe.descricao || '', cor: equipe.cor || undefined }
      : { nome: '', descricao: '' },
  })

  const corSelecionada = watch('cor')

  const onSubmit = async (formData: CriarEquipeForm) => {
    try {
      if (isEdicao) {
        await atualizar.mutateAsync({ id: equipe!.id, payload: formData })
      } else {
        await criar.mutateAsync(formData)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar equipe:', err)
    }
  }

  const handleExcluir = async () => {
    if (!equipe || !confirm('Tem certeza que deseja excluir esta equipe?')) return
    try {
      await excluir.mutateAsync(equipe.id)
      onClose()
    } catch (err) {
      console.error('Erro ao excluir equipe:', err)
    }
  }

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEdicao ? 'Editar Equipe' : 'Nova Equipe'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
            <input
              {...register('nome')}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
              placeholder="Ex: Vendas SP"
            />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
            <textarea
              {...register('descricao')}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none"
              placeholder="Descrição opcional da equipe"
            />
          </div>

          {/* Cor */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {coresEquipe.map(cor => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setValue('cor', cor)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${
                    corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {isEdicao && (
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={excluir.isPending}
                  className="text-sm text-destructive hover:text-destructive/80 transition-colors duration-200"
                >
                  Excluir
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdicao ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
