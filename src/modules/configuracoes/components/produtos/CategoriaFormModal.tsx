/**
 * AIDEV-NOTE: Modal de Criar/Editar Categoria de Produto
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { criarCategoriaSchema, type CriarCategoriaFormData } from '../../schemas/produtos.schema'
import { useCriarCategoria, useAtualizarCategoria, useExcluirCategoria } from '../../hooks/useProdutos'
import type { Categoria } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

const coresPadrao = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#F97316']

interface Props {
  categoria?: Categoria | null
  onClose: () => void
}

export function CategoriaFormModal({ categoria, onClose }: Props) {
  const isEditing = !!categoria
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const criarMutation = useCriarCategoria()
  const atualizarMutation = useAtualizarCategoria()
  const excluirMutation = useExcluirCategoria()

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CriarCategoriaFormData>({
    resolver: zodResolver(criarCategoriaSchema),
    defaultValues: { nome: '', descricao: '', cor: '#3B82F6' },
  })

  const corSelecionada = watch('cor') || '#3B82F6'

  useEffect(() => {
    if (categoria) reset({ nome: categoria.nome, descricao: categoria.descricao || '', cor: categoria.cor || '#3B82F6' })
  }, [categoria, reset])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarCategoriaFormData) => {
    const payload = { ...data, descricao: data.descricao || undefined }
    if (isEditing && categoria) {
      atualizarMutation.mutate({ id: categoria.id, payload }, { onSuccess: onClose })
    } else {
      criarMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (!categoria) return
    excluirMutation.mutate(categoria.id, { onSuccess: onClose })
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && (
          showDeleteConfirm ? (
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
        <button type="submit" form="categoria-form" disabled={isSubmitting} className="flex-1 sm:flex-none px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Categoria' : 'Nova Categoria'} description="Produtos" variant={isEditing ? 'edit' : 'create'} size="sm" footer={footerContent}>
      <form id="categoria-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        <div>
          <label htmlFor="cat-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="cat-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: Software" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="cat-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="cat-desc" {...register('descricao')} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200" placeholder="Descrição opcional" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
          <div className="flex items-center gap-2 flex-wrap">
            {coresPadrao.map(cor => (
              <button key={cor} type="button" onClick={() => setValue('cor', cor)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${corSelecionada === cor ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: cor }} />
            ))}
            <input type="color" value={corSelecionada} onChange={e => setValue('cor', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-input" />
          </div>
        </div>

        {(criarMutation.error || atualizarMutation.error) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar categoria'}</p>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
