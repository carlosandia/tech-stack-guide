/**
 * AIDEV-NOTE: Modal para criar/editar Webhook de Saída
 * Conforme PRD-05 - Webhooks de Saída
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Send, Check } from 'lucide-react'
import {
  webhookSaidaFormSchema,
  type WebhookSaidaFormData,
  eventoWebhookOptions,
  tipoAuthOptions,
} from '../../schemas/webhooks.schema'
import type { WebhookSaida } from '../../services/configuracoes.api'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: WebhookSaidaFormData) => void
  webhook?: WebhookSaida | null
  isLoading?: boolean
}

export function WebhookSaidaFormModal({ open, onClose, onSubmit, webhook, isLoading }: Props) {
  const isEditing = !!webhook

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<WebhookSaidaFormData>({
    resolver: zodResolver(webhookSaidaFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      url: '',
      eventos: [],
      auth_tipo: 'nenhum',
      auth_header: '',
      auth_valor: '',
      retry_ativo: true,
      max_tentativas: 3,
    },
  })

  const authTipo = watch('auth_tipo')

  useEffect(() => {
    if (open) {
      if (webhook) {
        reset({
          nome: webhook.nome,
          descricao: webhook.descricao || '',
          url: webhook.url,
          eventos: webhook.eventos,
          auth_tipo: webhook.tipo_autenticacao as WebhookSaidaFormData['auth_tipo'],
          auth_header: '',
          auth_valor: '',
          retry_ativo: webhook.retry_ativo,
          max_tentativas: webhook.max_tentativas,
        })
      } else {
        reset({
          nome: '',
          descricao: '',
          url: '',
          eventos: [],
          auth_tipo: 'nenhum',
          auth_header: '',
          auth_valor: '',
          retry_ativo: true,
          max_tentativas: 3,
        })
      }
    }
  }, [open, webhook, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Editar Webhook' : 'Novo Webhook de Saída'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              {...register('nome')}
              placeholder="Ex: Notificar ERP"
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

          {/* URL */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              URL de destino <span className="text-destructive">*</span>
            </label>
            <input
              {...register('url')}
              placeholder="https://api.exemplo.com/webhook"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            {errors.url && <p className="text-xs text-destructive mt-1">{errors.url.message}</p>}
          </div>

          {/* Eventos */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Eventos <span className="text-destructive">*</span>
            </label>
            <Controller
              name="eventos"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {eventoWebhookOptions.map((evento) => {
                    const isSelected = field.value.includes(evento.value)
                    return (
                      <label
                        key={evento.value}
                        className={`
                          flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm
                          ${isSelected
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                          }
                        `}
                      >
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-primary border-primary' : 'border-input'}
                        `}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span>{evento.label}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.eventos && <p className="text-xs text-destructive mt-1">{errors.eventos.message}</p>}
          </div>

          {/* Autenticação */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">Autenticação</label>
            <select
              {...register('auth_tipo')}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {tipoAuthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {authTipo !== 'nenhum' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {authTipo === 'api_key' ? 'Header Name' : authTipo === 'basic' ? 'Usuário' : 'Header'}
                  </label>
                  <input
                    {...register('auth_header')}
                    placeholder={authTipo === 'api_key' ? 'X-Api-Key' : authTipo === 'basic' ? 'user' : 'Authorization'}
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {authTipo === 'basic' ? 'Senha' : 'Valor'}
                  </label>
                  <input
                    {...register('auth_valor')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Retry */}
          <div className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Retry automático</p>
              <p className="text-xs text-muted-foreground">Tentar novamente em caso de falha</p>
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="retry_ativo"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      relative w-10 h-5 rounded-full transition-colors
                      ${field.value ? 'bg-primary' : 'bg-muted-foreground/30'}
                    `}
                  >
                    <span className={`
                      absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${field.value ? 'left-5' : 'left-0.5'}
                    `} />
                  </button>
                )}
              />
              {watch('retry_ativo') && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    {...register('max_tentativas', { valueAsNumber: true })}
                    min={1}
                    max={10}
                    className="w-14 px-2 py-1 text-sm text-center rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">tentativas</span>
                </div>
              )}
            </div>
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
