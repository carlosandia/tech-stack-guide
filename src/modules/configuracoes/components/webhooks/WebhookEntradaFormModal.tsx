/**
 * AIDEV-NOTE: Modal para criar/editar Webhook de Entrada
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Webhook, Key, Shield, Loader2 } from 'lucide-react'
import { webhookEntradaFormSchema, type WebhookEntradaFormData } from '../../schemas/webhooks.schema'
import type { WebhookEntrada } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: WebhookEntradaFormData) => void
  webhook?: WebhookEntrada | null
  isLoading?: boolean
}

export function WebhookEntradaFormModal({ open, onClose, onSubmit, webhook, isLoading }: Props) {
  const isEditing = !!webhook

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WebhookEntradaFormData>({
    resolver: zodResolver(webhookEntradaFormSchema),
    defaultValues: { nome: '', descricao: '', api_key: '', secret_key: '' },
  })

  useEffect(() => {
    if (open) {
      if (webhook) {
        reset({ nome: webhook.nome, descricao: webhook.descricao || '', api_key: webhook.api_key || '', secret_key: '' })
      } else {
        reset({ nome: '', descricao: '', api_key: '', secret_key: '' })
      }
    }
  }, [open, webhook, reset])

  if (!open) return null

  const footerContent = (
    <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
      <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
      <button type="submit" form="wh-entrada-form" disabled={isLoading}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Webhook'}
      </button>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Webhook' : 'Novo Webhook de Entrada'} description="Webhooks" icon={Webhook} variant={isEditing ? 'edit' : 'create'} size="md" footer={footerContent}>
      <form id="wh-entrada-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4">
        <div>
          <label htmlFor="whe-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="whe-nome" {...register('nome')} placeholder="Ex: Formulário do Site"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label htmlFor="whe-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="whe-desc" {...register('descricao')} rows={2} placeholder="Descrição opcional"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200" />
        </div>

        <div>
          <label htmlFor="whe-apikey" className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-muted-foreground" /> API Key (opcional)
          </label>
          <input id="whe-apikey" {...register('api_key')} placeholder="Chave para autenticar requests recebidos"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring font-mono transition-all duration-200" />
          <p className="text-xs text-muted-foreground mt-1">Se definida, requests devem incluir header X-Api-Key ou Authorization: Bearer</p>
        </div>

        <div>
          <label htmlFor="whe-secret" className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Secret Key (opcional)
          </label>
          <input id="whe-secret" {...register('secret_key')} type="password" placeholder="Para validação de assinatura HMAC"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring font-mono transition-all duration-200" />
        </div>
      </form>
    </ModalBase>
  )
}
