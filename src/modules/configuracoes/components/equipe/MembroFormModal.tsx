/**
 * AIDEV-NOTE: Modal de convidar/editar usuário do tenant
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useConvidarUsuario, useAtualizarUsuario, usePerfis, useEquipes } from '../../hooks/useEquipe'
import { convidarUsuarioSchema, type ConvidarUsuarioForm } from '../../schemas/equipe.schema'
import type { UsuarioTenant } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

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

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ConvidarUsuarioForm>({
    resolver: zodResolver(convidarUsuarioSchema),
    defaultValues: usuario
      ? { nome: usuario.nome, sobrenome: usuario.sobrenome || '', email: usuario.email, papel_id: usuario.perfil_permissao_id || undefined }
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
    } catch (err) { console.error('Erro ao salvar usuário:', err) }
  }

  const perfis = perfisData?.perfis || []
  const equipes = equipesData?.equipes || []

  const footerContent = (
    <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
      <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
      <button type="submit" form="membro-form" disabled={isSubmitting}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdicao ? 'Salvar' : 'Convidar'}
      </button>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEdicao ? 'Editar Membro' : 'Convidar Membro'} description="Equipe" icon={UserPlus} variant={isEdicao ? 'edit' : 'create'} size="sm" footer={footerContent}>
      <form id="membro-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        {/* Nome + Sobrenome */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mb-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
            <input id="mb-nome" {...register('nome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Nome" aria-invalid={!!errors.nome} />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label htmlFor="mb-sobrenome" className="block text-sm font-medium text-foreground mb-1">Sobrenome</label>
            <input id="mb-sobrenome" {...register('sobrenome')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" placeholder="Sobrenome" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="mb-email" className="block text-sm font-medium text-foreground mb-1">E-mail <span className="text-destructive">*</span></label>
          <input id="mb-email" {...register('email')} type="email" disabled={isEdicao}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="usuario@empresa.com" aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        {/* Perfil de Permissão */}
        <div>
          <label htmlFor="mb-perfil" className="block text-sm font-medium text-foreground mb-1">Perfil de Permissão</label>
          <select id="mb-perfil" {...register('papel_id')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
            <option value="">Selecione um perfil</option>
            {perfis.map(perfil => (<option key={perfil.id} value={perfil.id}>{perfil.nome} {perfil.is_admin ? '(Admin)' : ''}</option>))}
          </select>
        </div>

        {/* Equipes */}
        {equipes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Equipes</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {equipes.map(equipe => (
                <label key={equipe.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" value={equipe.id}
                    onChange={e => {
                      const current = watch('equipe_ids') || []
                      if (e.target.checked) { setValue('equipe_ids', [...current, equipe.id]) }
                      else { setValue('equipe_ids', current.filter(id => id !== equipe.id)) }
                    }}
                    className="rounded border-input" />
                  <span className="flex items-center gap-1.5">
                    {equipe.cor && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: equipe.cor }} />}
                    {equipe.nome}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </form>
    </ModalBase>
  )
}
