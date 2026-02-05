/**
 * AIDEV-NOTE: Modal de Criar/Editar Motivo de Resultado
 * Conforme Design System 10.5 - Modal com Header/Footer fixos
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Pencil, Loader2, Trash2 } from 'lucide-react'
import { criarMotivoSchema, type CriarMotivoFormData } from '../../schemas/motivos.schema'
import { useCriarMotivo, useAtualizarMotivo, useExcluirMotivo } from '../../hooks/useMotivos'
import type { MotivoResultado, TipoMotivo } from '../../services/configuracoes.api'

const coresGanho = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#22C55E', '#16A34A']
const coresPerda = ['#EF4444', '#DC2626', '#F87171', '#FCA5A5', '#F97316', '#E11D48']

interface Props {
  tipo: TipoMotivo
  motivo?: MotivoResultado | null
  onClose: () => void
}

export function MotivoFormModal({ tipo, motivo, onClose }: Props) {
  const isEditing = !!motivo
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const criarMutation = useCriarMotivo()
  const atualizarMutation = useAtualizarMotivo()
  const excluirMutation = useExcluirMotivo()

  const coresPaleta = tipo === 'ganho' ? coresGanho : coresPerda

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CriarMotivoFormData>({
    resolver: zodResolver(criarMotivoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo,
      cor: coresPaleta[0],
    },
  })

  const corSelecionada = watch('cor') || coresPaleta[0]

  useEffect(() => {
    if (motivo) {
      reset({
        nome: motivo.nome,
        descricao: motivo.descricao || '',
        tipo: motivo.tipo,
        cor: motivo.cor || coresPaleta[0],
      })
    }
  }, [motivo, reset, coresPaleta])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarMotivoFormData) => {
    const payload = {
      ...data,
      descricao: data.descricao || undefined,
    }

    if (isEditing && motivo) {
      const { tipo: _t, ...updatePayload } = payload
      atualizarMutation.mutate(
        { id: motivo.id, payload: updatePayload },
        { onSuccess: onClose }
      )
    } else {
      criarMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (!motivo) return
    excluirMutation.mutate(motivo.id, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEditing ? 'bg-accent' : 'bg-primary/10'}`}>
              {isEditing ? <Pencil className="w-5 h-5 text-muted-foreground" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Editar Motivo' : 'Novo Motivo'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {tipo === 'ganho' ? 'Motivo de Ganho' : 'Motivo de Perda'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-all duration-200">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="motivo-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome <span className="text-destructive">*</span>
              </label>
              <input
                {...register('nome')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder={tipo === 'ganho' ? 'Ex: Preço competitivo' : 'Ex: Preço muito alto'}
              />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea
                {...register('descricao')}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200"
                placeholder="Descrição opcional"
              />
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
              <div className="flex items-center gap-2 flex-wrap">
                {coresPaleta.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setValue('cor', cor)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
                <input
                  type="color"
                  value={corSelecionada}
                  onChange={e => setValue('cor', e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border border-input"
                />
              </div>
            </div>

            {/* Hidden tipo field */}
            <input type="hidden" {...register('tipo')} />

            {/* Erro de mutação */}
            {(criarMutation.error || atualizarMutation.error) && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  {(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar motivo'}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            {isEditing && !motivo?.padrao && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Confirmar?</span>
                  <button type="button" onClick={handleDelete} disabled={excluirMutation.isPending}
                    className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200">
                    {excluirMutation.isPending ? 'Excluindo...' : 'Sim'}
                  </button>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200">
                    Não
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">
              Cancelar
            </button>
            <button type="submit" form="motivo-form" disabled={isSubmitting}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
