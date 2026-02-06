/**
 * AIDEV-NOTE: Modal de convidar/editar usuário do tenant
 * Conforme PRD-05 - Gestão de Equipe
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, UserPlus } from 'lucide-react'
import { useConvidarUsuario, useAtualizarUsuario, usePerfis, useEquipes } from '../../hooks/useEquipe'
import { convidarUsuarioSchema, type ConvidarUsuarioForm } from '../../schemas/equipe.schema'
import type { UsuarioTenant } from '../../services/configuracoes.api'

interface Props {
  usuario?: UsuarioTenant | null
  onClose: () => void
}

export function MembroFormModal({ usuario, onClose }: Props) {
  const isEdicao = !!usuario
  const convidar = useConvidarUsuario()
  const atualizar = useAtualizarUsuario()
  const { data: perfisData } = usePerfis()
  const { data: equipesData } = useEquipes()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConvidarUsuarioForm>({
    resolver: zodResolver(convidarUsuarioSchema),
    defaultValues: usuario
      ? {
          nome: usuario.nome,
          sobrenome: usuario.sobrenome || '',
          email: usuario.email,
          papel_id: usuario.papel_id || undefined,
        }
      : { nome: '', sobrenome: '', email: '' },
  })

  const onSubmit = async (formData: ConvidarUsuarioForm) => {
    try {
      if (isEdicao) {
        const { email, ...rest } = formData
        await atualizar.mutateAsync({ id: usuario!.id, payload: rest })
      } else {
        await convidar.mutateAsync(formData)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar usuário:', err)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const perfis = perfisData?.perfis || []
  const equipes = equipesData?.equipes || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEdicao ? 'Editar Membro' : 'Convidar Membro'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome + Sobrenome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
              <input
                {...register('nome')}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Nome"
              />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Sobrenome</label>
              <input
                {...register('sobrenome')}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                placeholder="Sobrenome"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
            <input
              {...register('email')}
              type="email"
              disabled={isEdicao}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="usuario@empresa.com"
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          {/* Perfil de Permissão */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Perfil de Permissão</label>
            <select
              {...register('papel_id')}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
            >
              <option value="">Selecione um perfil</option>
              {perfis.map(perfil => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome} {perfil.is_admin ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Equipes */}
          {equipes.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Equipes</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {equipes.map(equipe => (
                  <label key={equipe.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      value={equipe.id}
                      onChange={e => {
                        const current = watch('equipe_ids') || []
                        if (e.target.checked) {
                          setValue('equipe_ids', [...current, equipe.id])
                        } else {
                          setValue('equipe_ids', current.filter(id => id !== equipe.id))
                        }
                      }}
                      className="rounded border-input"
                    />
                    <span className="flex items-center gap-1.5">
                      {equipe.cor && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: equipe.cor }} />
                      )}
                      {equipe.nome}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
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
              {isEdicao ? 'Salvar' : 'Convidar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
