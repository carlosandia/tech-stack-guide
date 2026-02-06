/**
 * AIDEV-NOTE: Modal de criar/editar perfil de permissão
 * Migrado para usar ModalBase (Design System 10.5)
 * confirm() nativo substituído por confirmação inline
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Shield, Check, Trash2 } from 'lucide-react'
import { useCriarPerfil, useAtualizarPerfil, useExcluirPerfil } from '../../hooks/useEquipe'
import { criarPerfilSchema, modulosDisponiveis, acoesDisponiveis, type CriarPerfilForm } from '../../schemas/equipe.schema'
import type { PerfilPermissao, Permissao } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface Props {
  perfil?: PerfilPermissao | null
  onClose: () => void
}

const acaoLabels: Record<string, string> = {
  visualizar: 'Ver', criar: 'Criar', editar: 'Editar', excluir: 'Excluir', gerenciar: 'Gerenciar',
}

export function PerfilFormModal({ perfil, onClose }: Props) {
  const isEdicao = !!perfil
  const isSistema = perfil?.is_sistema || false
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const criar = useCriarPerfil()
  const atualizar = useAtualizarPerfil()
  const excluir = useExcluirPerfil()

  const [permissoes, setPermissoes] = useState<Record<string, string[]>>(() => {
    if (perfil?.permissoes) {
      const map: Record<string, string[]> = {}
      perfil.permissoes.forEach(p => { map[p.modulo] = [...p.acoes] })
      return map
    }
    return {}
  })

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CriarPerfilForm>({
    resolver: zodResolver(criarPerfilSchema),
    defaultValues: perfil
      ? { nome: perfil.nome, descricao: perfil.descricao || '', is_admin: perfil.is_admin, permissoes: perfil.permissoes }
      : { nome: '', descricao: '', is_admin: false, permissoes: [] },
  })

  useEffect(() => {
    const arr: Permissao[] = Object.entries(permissoes).filter(([, acoes]) => acoes.length > 0).map(([modulo, acoes]) => ({ modulo, acoes: acoes as Permissao['acoes'] }))
    setValue('permissoes', arr)
  }, [permissoes, setValue])

  const toggleAcao = (modulo: string, acao: string) => {
    if (isSistema) return
    setPermissoes(prev => {
      const current = prev[modulo] || []
      const next = current.includes(acao) ? current.filter(a => a !== acao) : [...current, acao]
      return { ...prev, [modulo]: next }
    })
  }

  const toggleModulo = (modulo: string) => {
    if (isSistema) return
    setPermissoes(prev => {
      const current = prev[modulo] || []
      const allSelected = acoesDisponiveis.every(a => current.includes(a))
      return { ...prev, [modulo]: allSelected ? [] : [...acoesDisponiveis] }
    })
  }

  const onSubmit = async (formData: CriarPerfilForm) => {
    try {
      if (isEdicao) { await atualizar.mutateAsync({ id: perfil!.id, payload: formData }) }
      else { await criar.mutateAsync(formData) }
      onClose()
    } catch (err) { console.error('Erro ao salvar perfil:', err) }
  }

  const handleExcluir = async () => {
    if (!perfil || isSistema) return
    try { await excluir.mutateAsync(perfil.id); onClose() }
    catch (err) { console.error('Erro ao excluir perfil:', err) }
  }

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div>
        {isEdicao && !isSistema && (
          showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Confirmar?</span>
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
        <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">
          {isSistema ? 'Fechar' : 'Cancelar'}
        </button>
        {!isSistema && (
          <button type="submit" form="perfil-form" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdicao ? 'Salvar' : 'Criar'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEdicao ? 'Editar Perfil' : 'Novo Perfil'} description="Permissões" icon={Shield} variant={isEdicao ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="perfil-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        {isSistema && (
          <div className="px-3 py-2 rounded-md bg-muted text-xs text-muted-foreground">Perfis de sistema não podem ser editados</div>
        )}

        <div>
          <label htmlFor="pf-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="pf-nome" {...register('nome')} disabled={isSistema}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
            placeholder="Ex: Vendedor" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="pf-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <input id="pf-desc" {...register('descricao')} disabled={isSistema}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50"
            placeholder="Descrição do perfil" />
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" {...register('is_admin')} disabled={isSistema} className="rounded border-input" />
          Acesso de administrador (todas as permissões)
        </label>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Permissões</label>
          {errors.permissoes && <p className="text-xs text-destructive mb-2">{errors.permissoes.message}</p>}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-3 py-2 bg-muted text-xs font-medium text-muted-foreground border-b border-border">
              <span>Módulo</span>
              {acoesDisponiveis.map(acao => (<span key={acao} className="text-center">{acaoLabels[acao]}</span>))}
            </div>
            {modulosDisponiveis.map(mod => {
              const moduloPerms = permissoes[mod.value] || []
              const allSelected = acoesDisponiveis.every(a => moduloPerms.includes(a))
              return (
                <div key={mod.value} className="grid grid-cols-[1fr,repeat(5,40px)] gap-0 px-3 py-2 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
                  <button type="button" onClick={() => toggleModulo(mod.value)} className={`text-sm text-left ${allSelected ? 'text-primary font-medium' : 'text-foreground'}`}>{mod.label}</button>
                  {acoesDisponiveis.map(acao => (
                    <div key={acao} className="flex items-center justify-center">
                      <button type="button" onClick={() => toggleAcao(mod.value, acao)} disabled={isSistema}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                          moduloPerms.includes(acao) ? 'bg-primary border-primary text-primary-foreground' : 'border-input hover:border-primary/50'
                        } disabled:opacity-50`}>
                        {moduloPerms.includes(acao) && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </form>
    </ModalBase>
  )
}
