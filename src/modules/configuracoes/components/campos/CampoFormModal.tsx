import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2, Link2 } from 'lucide-react'
import { X } from 'lucide-react'
import { criarCampoSchema, type CriarCampoFormData, tipoCampoOptions } from '../../schemas/campos.schema'
import { getTipoLabel } from './CamposList'
import { useCriarCampo, useAtualizarCampo, useExcluirCampo } from '../../hooks/useCampos'
import { useVinculosPipelines } from '../../hooks/useVinculosPipelines'
import type { CampoCustomizado, Entidade } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

/**
 * AIDEV-NOTE: Modal de Criar/Editar Campo Personalizado
 * Migrado para usar ModalBase (Design System 10.5)
 * Protege exclusão de campos vinculados a pipelines
 */

interface Props {
  entidade: Entidade
  campo?: CampoCustomizado | null
  onClose: () => void
}

const tiposComOpcoes = ['select', 'multi_select']

export function CampoFormModal({ entidade, campo, onClose }: Props) {
  const isEditing = !!campo
  const isSistema = !!campo?.sistema
  const [opcaoInput, setOpcaoInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const criarMutation = useCriarCampo()
  const atualizarMutation = useAtualizarCampo(entidade)
  const excluirMutation = useExcluirCampo(entidade)

  // AIDEV-NOTE: Buscar vínculos com pipelines para bloquear exclusão
  const { data: vinculos = [] } = useVinculosPipelines('campo', campo?.id)
  const temVinculos = vinculos.length > 0

  const {
    register, handleSubmit, watch, setValue, formState: { errors }, reset,
  } = useForm<CriarCampoFormData>({
    resolver: zodResolver(criarCampoSchema),
    defaultValues: {
      nome: '', descricao: '', entidade, tipo: 'texto',
      obrigatorio: false, valor_padrao: '', placeholder: '', opcoes: [],
    },
  })

  const tipoSelecionado = watch('tipo')
  const opcoes = watch('opcoes') || []

  useEffect(() => {
    if (campo) {
      reset({
        nome: campo.nome, descricao: campo.descricao || '', entidade: campo.entidade,
        tipo: campo.tipo, obrigatorio: campo.obrigatorio, valor_padrao: campo.valor_padrao || '',
        placeholder: campo.placeholder || '', opcoes: campo.opcoes || [],
      })
    }
  }, [campo, reset])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarCampoFormData) => {
    if (isSistema && campo) {
      atualizarMutation.mutate(
        { id: campo.id, payload: { obrigatorio: data.obrigatorio } },
        { onSuccess: onClose }
      )
      return
    }

    const payload = {
      ...data,
      descricao: data.descricao || undefined,
      valor_padrao: data.valor_padrao || undefined,
      placeholder: data.placeholder || undefined,
      opcoes: tiposComOpcoes.includes(data.tipo) ? data.opcoes : [],
    }
    if (isEditing && campo) {
      const { entidade: _e, tipo: _t, ...updatePayload } = payload
      atualizarMutation.mutate({ id: campo.id, payload: updatePayload }, { onSuccess: onClose })
    } else {
      criarMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleAddOpcao = () => {
    const trimmed = opcaoInput.trim()
    if (trimmed && !opcoes.includes(trimmed)) {
      setValue('opcoes', [...opcoes, trimmed])
      setOpcaoInput('')
    }
  }

  const handleRemoveOpcao = (index: number) => {
    setValue('opcoes', opcoes.filter((_, i) => i !== index))
  }

  const handleDelete = () => {
    if (!campo) return
    excluirMutation.mutate(campo.id, { onSuccess: onClose })
  }

  const entidadeLabel = entidade === 'pessoa' ? 'Pessoas' :
    entidade === 'empresa' ? 'Empresas' : 'Oportunidades'

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEditing && !campo?.sistema && (
          temVinculos ? (
            <div className="flex items-center gap-1.5 px-3 h-9 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>Vinculado a {vinculos.length} pipeline(s)</span>
            </div>
          ) : showDeleteConfirm ? (
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
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onClose}
          className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">
          Cancelar
        </button>
        <button type="submit" form="campo-form" disabled={isSubmitting}
          className="flex-1 sm:flex-none px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar Campo'}
        </button>
      </div>
    </div>
  )

  return (
    <ModalBase
      onClose={onClose}
      title={isSistema ? 'Campo do Sistema' : (isEditing ? 'Editar Campo' : 'Novo Campo')}
      description={entidadeLabel}
      variant={isEditing ? 'edit' : 'create'}
      size="md"
      footer={footerContent}
    >
      <form id="campo-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
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

        {isSistema ? (
          <>
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-muted-foreground mb-1">Nome</span>
                <p className="text-sm text-foreground">{campo?.nome}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-muted-foreground mb-1">Tipo</span>
                <p className="text-sm text-foreground">{getTipoLabel(campo?.tipo || '')}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('obrigatorio')} className="w-4 h-4 rounded border-input text-primary focus:ring-primary" />
                <span className="text-sm text-foreground">Campo obrigatório</span>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Campos do sistema não podem ser renomeados, excluídos ou ter seu tipo alterado.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Nome */}
            <div>
              <label htmlFor="campo-nome" className="block text-sm font-medium text-foreground mb-1">
                Nome <span className="text-destructive">*</span>
              </label>
              <input id="campo-nome" {...register('nome')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Ex: Origem do Lead" aria-invalid={!!errors.nome} />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="campo-tipo" className="block text-sm font-medium text-foreground mb-1">
                Tipo <span className="text-destructive">*</span>
              </label>
              <select id="campo-tipo" {...register('tipo')} disabled={isEditing}
                className={`w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {tipoCampoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isEditing && <p className="text-xs text-muted-foreground mt-1">O tipo não pode ser alterado</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="campo-descricao" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea id="campo-descricao" {...register('descricao')} rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200"
                placeholder="Descrição opcional do campo" />
            </div>

            {/* Opções (select / multi_select) */}
            {tiposComOpcoes.includes(tipoSelecionado) && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Opções <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input value={opcaoInput} onChange={e => setOpcaoInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOpcao() } }}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                    placeholder="Digite uma opção e pressione Enter" />
                  <button type="button" onClick={handleAddOpcao}
                    className="h-10 px-3 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-all duration-200">
                    Adicionar
                  </button>
                </div>
                {opcoes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {opcoes.map((opcao, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                        {opcao}
                        <button type="button" onClick={() => handleRemoveOpcao(index)} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder */}
            <div>
              <label htmlFor="campo-placeholder" className="block text-sm font-medium text-foreground mb-1">Placeholder</label>
              <input id="campo-placeholder" {...register('placeholder')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Texto de exemplo no campo" />
            </div>

            {/* Obrigatório */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('obrigatorio')} className="w-4 h-4 rounded border-input text-primary focus:ring-primary" />
              <span className="text-sm text-foreground">Campo obrigatório</span>
            </label>
          </>
        )}

        {/* Erro de mutação */}
        {(criarMutation.error || atualizarMutation.error) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              {(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar campo'}
            </p>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
