/**
 * AIDEV-NOTE: Modal de criar/editar perfil de permissão
 * Conforme PRD-05 - Perfis de Permissão
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Shield, Check } from 'lucide-react'
import { useCriarPerfil, useAtualizarPerfil, useExcluirPerfil } from '../../hooks/useEquipe'
import {
  criarPerfilSchema,
  modulosDisponiveis,
  acoesDisponiveis,
  type CriarPerfilForm,
} from '../../schemas/equipe.schema'
import type { PerfilPermissao, Permissao } from '../../services/configuracoes.api'

interface Props {
  perfil?: PerfilPermissao | null
  onClose: () => void
}

const acaoLabels: Record<string, string> = {
  visualizar: 'Ver',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  gerenciar: 'Gerenciar',
}

export function PerfilFormModal({ perfil, onClose }: Props) {
  const isEdicao = !!perfil
  const isSistema = perfil?.is_sistema || false
  const criar = useCriarPerfil()
  const atualizar = useAtualizarPerfil()
  const excluir = useExcluirPerfil()

  // State local para a matrix de permissões
  const [permissoes, setPermissoes] = useState<Record<string, string[]>>(() => {
    if (perfil?.permissoes) {
      const map: Record<string, string[]> = {}
      perfil.permissoes.forEach(p => { map[p.modulo] = [...p.acoes] })
      return map
    }
    return {}
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CriarPerfilForm>({
    resolver: zodResolver(criarPerfilSchema),
    defaultValues: perfil
      ? { nome: perfil.nome, descricao: perfil.descricao || '', is_admin: perfil.is_admin, permissoes: perfil.permissoes }
      : { nome: '', descricao: '', is_admin: false, permissoes: [] },
  })

  // Sincronizar permissões no form
  useEffect(() => {
    const arr: Permissao[] = Object.entries(permissoes)
      .filter(([, acoes]) => acoes.length > 0)
      .map(([modulo, acoes]) => ({ modulo, acoes: acoes as Permissao['acoes'] }))
    setValue('permissoes', arr)
  }, [permissoes, setValue])

  const toggleAcao = (modulo: string, acao: string) => {
    if (isSistema) return
    setPermissoes(prev => {
      const current = prev[modulo] || []
      const next = current.includes(acao)
        ? current.filter(a => a !== acao)
        : [...current, acao]
      return { ...prev, [modulo]: next }
    })
  }

  const toggleModulo = (modulo: string) => {
    if (isSistema) return
    setPermissoes(prev => {
      const current = prev[modulo] || []
      const allSelected = acoesDisponiveis.every(a => current.includes(a))
      return {
        ...prev,
        [modulo]: allSelected ? [] : [...acoesDisponiveis],
      }
    })
  }

  const onSubmit = async (formData: CriarPerfilForm) => {
    try {
      if (isEdicao) {
        await atualizar.mutateAsync({ id: perfil!.id, payload: formData })
      } else {
        await criar.mutateAsync(formData)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
    }
  }

  const handleExcluir = async () => {
    if (!perfil || isSistema || !confirm('Tem certeza que deseja excluir este perfil?')) return
    try {
      await excluir.mutateAsync(perfil.id)
      onClose()
    } catch (err) {
      console.error('Erro ao excluir perfil:', err)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEdicao ? 'Editar Perfil' : 'Novo Perfil'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {isSistema && (
              <div className="px-3 py-2 rounded-md bg-warning-muted text-warning-foreground text-xs">
                Perfis de sistema não podem ser editados
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
              <input
                {...register('nome')}
                disabled={isSistema}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
                placeholder="Ex: Vendedor"
              />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
              <input
                {...register('descricao')}
                disabled={isSistema}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
                placeholder="Descrição do perfil"
              />
            </div>

            {/* Admin toggle */}
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                {...register('is_admin')}
                disabled={isSistema}
                className="rounded border-input"
              />
              Acesso de administrador (todas as permissões)
            </label>

            {/* Matriz de Permissões */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Permissões</label>
              {errors.permissoes && <p className="text-xs text-destructive mb-2">{errors.permissoes.message}</p>}
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-3 py-2 bg-muted text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Módulo</span>
                  {acoesDisponiveis.map(acao => (
                    <span key={acao} className="text-center">{acaoLabels[acao]}</span>
                  ))}
                </div>
                {/* Rows */}
                {modulosDisponiveis.map(mod => {
                  const moduloPerms = permissoes[mod.value] || []
                  const allSelected = acoesDisponiveis.every(a => moduloPerms.includes(a))
                  return (
                    <div
                      key={mod.value}
                      className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-3 py-2 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleModulo(mod.value)}
                        className={`text-sm text-left ${allSelected ? 'text-primary font-medium' : 'text-foreground'}`}
                      >
                        {mod.label}
                      </button>
                      {acoesDisponiveis.map(acao => (
                        <div key={acao} className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => toggleAcao(mod.value, acao)}
                            disabled={isSistema}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                              moduloPerms.includes(acao)
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input hover:border-primary/50'
                            } disabled:opacity-50`}
                          >
                            {moduloPerms.includes(acao) && <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
            <div>
              {isEdicao && !isSistema && (
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
                {isSistema ? 'Fechar' : 'Cancelar'}
              </button>
              {!isSistema && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEdicao ? 'Salvar' : 'Criar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
