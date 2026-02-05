import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Pencil, Loader2, Trash2 } from 'lucide-react'
import { criarCampoSchema, type CriarCampoFormData, tipoCampoOptions } from '../../schemas/campos.schema'
import { useCriarCampo, useAtualizarCampo, useExcluirCampo } from '../../hooks/useCampos'
import type { CampoCustomizado, Entidade } from '../../services/configuracoes.api'

/**
 * AIDEV-NOTE: Modal de Criar/Editar Campo Personalizado
 * Conforme Design System 10.5 - Modal com Header/Footer fixos
 */

interface Props {
  entidade: Entidade
  campo?: CampoCustomizado | null
  onClose: () => void
}

const tiposComOpcoes = ['select', 'multi_select']

export function CampoFormModal({ entidade, campo, onClose }: Props) {
  const isEditing = !!campo
  const [opcaoInput, setOpcaoInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const criarMutation = useCriarCampo()
  const atualizarMutation = useAtualizarCampo(entidade)
  const excluirMutation = useExcluirCampo(entidade)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CriarCampoFormData>({
    resolver: zodResolver(criarCampoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      entidade,
      tipo: 'texto',
      obrigatorio: false,
      valor_padrao: '',
      placeholder: '',
      opcoes: [],
    },
  })

  const tipoSelecionado = watch('tipo')
  const opcoes = watch('opcoes') || []

  useEffect(() => {
    if (campo) {
      reset({
        nome: campo.nome,
        descricao: campo.descricao || '',
        entidade: campo.entidade,
        tipo: campo.tipo,
        obrigatorio: campo.obrigatorio,
        valor_padrao: campo.valor_padrao || '',
        placeholder: campo.placeholder || '',
        opcoes: campo.opcoes || [],
      })
    }
  }, [campo, reset])

  const isSubmitting = criarMutation.isPending || atualizarMutation.isPending

  const onSubmit = (data: CriarCampoFormData) => {
    const payload = {
      ...data,
      descricao: data.descricao || undefined,
      valor_padrao: data.valor_padrao || undefined,
      placeholder: data.placeholder || undefined,
      opcoes: tiposComOpcoes.includes(data.tipo) ? data.opcoes : [],
    }

    if (isEditing && campo) {
      const { entidade: _e, tipo: _t, ...updatePayload } = payload
      atualizarMutation.mutate(
        { id: campo.id, payload: updatePayload },
        { onSuccess: onClose }
      )
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

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEditing ? 'bg-accent' : 'bg-primary/10'
            }`}>
              {isEditing
                ? <Pencil className="w-5 h-5 text-muted-foreground" />
                : <Plus className="w-5 h-5 text-primary" />
              }
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Editar Campo' : 'Novo Campo'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {entidade === 'contato' ? 'Contatos' :
                 entidade === 'pessoa' ? 'Pessoas' :
                 entidade === 'empresa' ? 'Empresas' : 'Oportunidades'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-all duration-200">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="campo-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome <span className="text-destructive">*</span>
              </label>
              <input
                {...register('nome')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Ex: Origem do Lead"
              />
              {errors.nome && (
                <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tipo <span className="text-destructive">*</span>
              </label>
              <select
                {...register('tipo')}
                disabled={isEditing}
                className={`w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 ${
                  isEditing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {tipoCampoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">O tipo não pode ser alterado</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea
                {...register('descricao')}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200"
                placeholder="Descrição opcional do campo"
              />
            </div>

            {/* Opções (select / multi_select) */}
            {tiposComOpcoes.includes(tipoSelecionado) && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Opções <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={opcaoInput}
                    onChange={e => setOpcaoInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOpcao() } }}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                    placeholder="Digite uma opção e pressione Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddOpcao}
                    className="h-10 px-3 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent transition-all duration-200"
                  >
                    Adicionar
                  </button>
                </div>
                {opcoes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {opcoes.map((opcao, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {opcao}
                        <button
                          type="button"
                          onClick={() => handleRemoveOpcao(index)}
                          className="hover:text-destructive transition-colors"
                        >
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
              <label className="block text-sm font-medium text-foreground mb-1">Placeholder</label>
              <input
                {...register('placeholder')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Texto de exemplo no campo"
              />
            </div>

            {/* Obrigatório */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('obrigatorio')}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Campo obrigatório</span>
            </label>

            {/* Erro de mutação */}
            {(criarMutation.error || atualizarMutation.error) && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  {(criarMutation.error || atualizarMutation.error)?.message || 'Erro ao salvar campo'}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            {isEditing && !campo?.sistema && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Confirmar?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={excluirMutation.isPending}
                    className="px-3 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all duration-200"
                  >
                    {excluirMutation.isPending ? 'Excluindo...' : 'Sim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent transition-all duration-200"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="campo-form"
              disabled={isSubmitting}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Campo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
