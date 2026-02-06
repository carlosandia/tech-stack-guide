/**
 * AIDEV-NOTE: Modal de Criar/Editar Produto
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { criarProdutoSchema, type CriarProdutoFormData, moedaOptions, unidadeOptions, periodoRecorrenciaOptions } from '../../schemas/produtos.schema'
import { useCriarProduto, useAtualizarProduto, useExcluirProduto, useCategorias } from '../../hooks/useProdutos'
import type { Produto } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface Props {
  produto?: Produto | null
  onClose: () => void
}

export function ProdutoFormModal({ produto, onClose }: Props) {
  const isEditing = !!produto
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const criarMutation = useCriarProduto()
  const atualizarMutation = useAtualizarProduto()
  const excluirMutation = useExcluirProduto()
  const { data: categoriasData } = useCategorias()

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<CriarProdutoFormData>({
    resolver: zodResolver(criarProdutoSchema),
    defaultValues: { nome: '', descricao: '', sku: '', preco: 0, moeda: 'BRL', unidade: 'un', recorrente: false, periodo_recorrencia: null, categoria_id: null },
  })

  const isRecorrente = watch('recorrente')

  useEffect(() => {
    if (produto) {
      reset({
        nome: produto.nome, descricao: produto.descricao || '', sku: produto.sku || '',
        preco: produto.preco, moeda: produto.moeda as 'BRL' | 'USD' | 'EUR',
        unidade: produto.unidade as 'un' | 'kg' | 'hora' | 'dia' | 'mes' | 'ano',
        recorrente: produto.recorrente,
        periodo_recorrencia: (produto.periodo_recorrencia as 'mensal' | 'trimestral' | 'semestral' | 'anual') || null,
        categoria_id: produto.categoria_id || null,
      })
    }
  }, [produto, reset])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarProdutoFormData) => {
    const payload = { ...data, descricao: data.descricao || undefined, sku: data.sku || undefined, periodo_recorrencia: data.recorrente ? data.periodo_recorrencia : undefined, categoria_id: data.categoria_id || undefined }
    if (isEditing && produto) {
      atualizarMutation.mutate({ id: produto.id, payload }, { onSuccess: onClose })
    } else {
      criarMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (!produto) return
    excluirMutation.mutate(produto.id, { onSuccess: onClose })
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && (
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
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
        <button type="submit" form="produto-form" disabled={isSubmitting}
          className="flex-1 sm:flex-none px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Produto' : 'Novo Produto'} description="Catálogo" variant={isEditing ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="produto-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        {/* Nome */}
        <div>
          <label htmlFor="prod-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="prod-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Ex: Plano Pro" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        {/* SKU + Categoria */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prod-sku" className="block text-sm font-medium text-foreground mb-1">SKU</label>
            <input id="prod-sku" {...register('sku')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="PRO-001" />
          </div>
          <div>
            <label htmlFor="prod-cat" className="block text-sm font-medium text-foreground mb-1">Categoria</label>
            <select id="prod-cat" {...register('categoria_id')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              <option value="">Sem categoria</option>
              {categoriasData?.categorias?.map(cat => (<option key={cat.id} value={cat.id}>{cat.nome}</option>))}
            </select>
          </div>
        </div>

        {/* Preço + Moeda + Unidade */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="prod-preco" className="block text-sm font-medium text-foreground mb-1">Preço <span className="text-destructive">*</span></label>
            <input id="prod-preco" type="number" step="0.01" min="0" {...register('preco', { valueAsNumber: true })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="0,00" aria-invalid={!!errors.preco} />
            {errors.preco && <p className="text-xs text-destructive mt-1">{errors.preco.message}</p>}
          </div>
          <div>
            <label htmlFor="prod-moeda" className="block text-sm font-medium text-foreground mb-1">Moeda</label>
            <select id="prod-moeda" {...register('moeda')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              {moedaOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="prod-unidade" className="block text-sm font-medium text-foreground mb-1">Unidade</label>
            <select id="prod-unidade" {...register('unidade')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              {unidadeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="prod-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="prod-desc" {...register('descricao')} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200" placeholder="Descrição opcional" />
        </div>

        {/* Recorrente */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('recorrente')} className="w-4 h-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm text-foreground">Produto recorrente (MRR)</span>
          </label>
          {isRecorrente && (
            <div>
              <label htmlFor="prod-periodo" className="block text-sm font-medium text-foreground mb-1">Período de recorrência</label>
              <select id="prod-periodo" {...register('periodo_recorrencia')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
                <option value="">Selecione</option>
                {periodoRecorrenciaOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          )}
        </div>

        {(criarMutation.error || atualizarMutation.error) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar produto'}</p>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
