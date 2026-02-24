/**
 * AIDEV-NOTE: Modal de Criar/Editar Motivo de Resultado
 * Migrado para usar ModalBase (Design System 10.5)
 * Protege exclusão de motivos vinculados a pipelines
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2, Link2 } from 'lucide-react'
import { criarMotivoSchema, type CriarMotivoFormData } from '../../schemas/motivos.schema'
import { useCriarMotivo, useAtualizarMotivo, useExcluirMotivo } from '../../hooks/useMotivos'
import { useVinculosPipelines } from '../../hooks/useVinculosPipelines'
import type { MotivoResultado, TipoMotivo } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

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

  // AIDEV-NOTE: Buscar vínculos com pipelines para bloquear exclusão
  const { data: vinculos = [] } = useVinculosPipelines('motivo', motivo?.id)
  const temVinculos = vinculos.length > 0

  const coresPaleta = tipo === 'ganho' ? coresGanho : coresPerda

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CriarMotivoFormData>({
    resolver: zodResolver(criarMotivoSchema),
    defaultValues: { nome: '', descricao: '', tipo, cor: coresPaleta[0] },
  })

  const corSelecionada = watch('cor') || coresPaleta[0]

  useEffect(() => {
    if (motivo) reset({ nome: motivo.nome, descricao: motivo.descricao || '', tipo: motivo.tipo, cor: motivo.cor || coresPaleta[0] })
  }, [motivo, reset, coresPaleta])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarMotivoFormData) => {
    const payload = { ...data, descricao: data.descricao || undefined }
    if (isEditing && motivo) {
      const { tipo: _t, ...updatePayload } = payload
      atualizarMutation.mutate({ id: motivo.id, payload: updatePayload }, { onSuccess: onClose })
    } else {
      criarMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (!motivo) return
    excluirMutation.mutate(motivo.id, { onSuccess: onClose })
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && !motivo?.padrao && (
          temVinculos ? (
            <div className="flex items-center gap-1.5 px-3 h-9 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>Vinculado a {vinculos.length} pipeline(s)</span>
            </div>
          ) : showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Confirmar?</span>
              <button type="button" onClick={handleDelete} disabled={excluirMutation.isPending} className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200">{excluirMutation.isPending ? 'Excluindo...' : 'Sim'}</button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200">Não</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200"><Trash2 className="w-4 h-4" /> Excluir</button>
          )
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
        <button type="submit" form="motivo-form" disabled={isSubmitting} className="flex-1 sm:flex-none px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Motivo' : 'Novo Motivo'} description={tipo === 'ganho' ? 'Motivo de Ganho' : 'Motivo de Perda'} variant={isEditing ? 'edit' : 'create'} size="sm" footer={footerContent}>
      <form id="motivo-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
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

        <div>
          <label htmlFor="mot-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="mot-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder={tipo === 'ganho' ? 'Ex: Preço competitivo' : 'Ex: Preço muito alto'} aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="mot-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="mot-desc" {...register('descricao')} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200" placeholder="Descrição opcional" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
          <div className="flex items-center gap-2 flex-wrap">
            {coresPaleta.map(cor => (
              <button key={cor} type="button" onClick={() => setValue('cor', cor)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: cor }} />
            ))}
            <input type="color" value={corSelecionada} onChange={e => setValue('cor', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-input" />
          </div>
        </div>

        <input type="hidden" {...register('tipo')} />

        {(criarMutation.error || atualizarMutation.error) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar motivo'}</p>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
