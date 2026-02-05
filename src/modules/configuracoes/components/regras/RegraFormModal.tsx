/**
 * AIDEV-NOTE: Modal de criação/edição de Regra de Qualificação (MQL)
 * Conforme PRD-05 - Regras MQL
 */

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { regraFormSchema, operadorOptions } from '../../schemas/regras.schema'
import type { RegraFormData } from '../../schemas/regras.schema'
import { useCriarRegra, useAtualizarRegra, useExcluirRegra } from '../../hooks/useRegras'
import { useCampos } from '../../hooks/useCampos'
import type { RegraQualificacao } from '../../services/configuracoes.api'

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

  // Carregar campos customizados (contato) para seleção
  const { data: camposData } = useCampos('contato')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegraFormData>({
    resolver: zodResolver(regraFormSchema),
    defaultValues: {
      nome: regra?.nome || '',
      descricao: regra?.descricao || '',
      campo_id: regra?.campo_id || '',
      operador: regra?.operador || 'igual',
      valor: regra?.valor || '',
      valores: regra?.valores || [],
    },
  })

  const operadorSelecionado = watch('operador')
  const precisaValor = !['vazio', 'nao_vazio'].includes(operadorSelecionado)

  const onSubmit = async (data: RegraFormData) => {
    try {
      if (isEditing && regra) {
        await atualizar.mutateAsync({ id: regra.id, payload: data })
      } else {
        await criar.mutateAsync(data)
      }
      onClose()
    } catch { /* tratado pelo React Query */ }
  }

  const handleDelete = async () => {
    if (!regra) return
    try {
      await excluir.mutateAsync(regra.id)
      onClose()
    } catch { /* tratado pelo React Query */ }
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
            {isEditing ? 'Editar Regra' : 'Nova Regra de Qualificação'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              {...register('nome')}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
              placeholder="Ex: Email corporativo"
            />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <textarea
              {...register('descricao')}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 resize-none"
              rows={2}
              placeholder="Descrição opcional da regra..."
            />
          </div>

          {/* Campo */}
          <div>
            <label className="text-sm font-medium text-foreground">Campo *</label>
            <select
              {...register('campo_id')}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
            >
              <option value="">Selecione um campo...</option>
              {camposData?.campos?.map(campo => (
                <option key={campo.id} value={campo.id}>
                  {campo.nome} ({campo.tipo})
                </option>
              ))}
            </select>
            {errors.campo_id && <p className="text-xs text-destructive mt-1">{errors.campo_id.message}</p>}
          </div>

          {/* Operador */}
          <div>
            <label className="text-sm font-medium text-foreground">Operador *</label>
            <select
              {...register('operador')}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
            >
              {operadorOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.operador && <p className="text-xs text-destructive mt-1">{errors.operador.message}</p>}
          </div>

          {/* Valor */}
          {precisaValor && (
            <div>
              <label className="text-sm font-medium text-foreground">Valor</label>
              <input
                {...register('valor')}
                className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Ex: gmail.com, hotmail.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para múltiplos valores, separe por vírgula
              </p>
            </div>
          )}

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
