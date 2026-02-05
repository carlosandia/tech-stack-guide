/**
 * AIDEV-NOTE: Modal para criar/editar Webhook de Entrada
 * Conforme PRD-05 - Webhooks de Entrada
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Webhook, Key, Shield } from 'lucide-react'
import { webhookEntradaFormSchema, type WebhookEntradaFormData } from '../../schemas/webhooks.schema'
import type { WebhookEntrada } from '../../services/configuracoes.api'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: WebhookEntradaFormData) => void
  webhook?: WebhookEntrada | null
  isLoading?: boolean
}

export function WebhookEntradaFormModal({ open, onClose, onSubmit, webhook, isLoading }: Props) {
  const isEditing = !!webhook

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookEntradaFormData>({
    resolver: zodResolver(webhookEntradaFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      api_key: '',
      secret_key: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (webhook) {
        reset({
          nome: webhook.nome,
          descricao: webhook.descricao || '',
          api_key: webhook.api_key || '',
          secret_key: '',
        })
      } else {
        reset({ nome: '', descricao: '', api_key: '', secret_key: '' })
      }
    }
  }, [open, webhook, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Editar Webhook' : 'Novo Webhook de Entrada'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              {...register('nome')}
              placeholder="Ex: Formulário do Site"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
            <textarea
              {...register('descricao')}
              rows={2}
              placeholder="Descrição opcional"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              API Key (opcional)
            </label>
            <input
              {...register('api_key')}
              placeholder="Chave para autenticar requests recebidos"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se definida, requests devem incluir header X-Api-Key ou Authorization: Bearer
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              Secret Key (opcional)
            </label>
            <input
              {...register('secret_key')}
              type="password"
              placeholder="Para validação de assinatura HMAC"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
