/**
 * AIDEV-NOTE: Modal para criar/editar Webhook de Saída
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, Check, Loader2 } from 'lucide-react'
import { webhookSaidaFormSchema, type WebhookSaidaFormData, eventoWebhookOptions, tipoAuthOptions } from '../../schemas/webhooks.schema'
import type { WebhookSaida } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: WebhookSaidaFormData) => void
  webhook?: WebhookSaida | null
  isLoading?: boolean
}

export function WebhookSaidaFormModal({ open, onClose, onSubmit, webhook, isLoading }: Props) {
  const isEditing = !!webhook

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<WebhookSaidaFormData>({
    resolver: zodResolver(webhookSaidaFormSchema),
    defaultValues: { nome: '', descricao: '', url: '', eventos: [], auth_tipo: 'nenhum', auth_header: '', auth_valor: '', retry_ativo: true, max_tentativas: 3 },
  })

  const authTipo = watch('auth_tipo')

  useEffect(() => {
    if (open) {
      if (webhook) {
        reset({ nome: webhook.nome, descricao: webhook.descricao || '', url: webhook.url, eventos: webhook.eventos, auth_tipo: webhook.auth_tipo as WebhookSaidaFormData['auth_tipo'], auth_header: '', auth_valor: '', retry_ativo: webhook.retry_ativo, max_tentativas: webhook.max_tentativas })
      } else {
        reset({ nome: '', descricao: '', url: '', eventos: [], auth_tipo: 'nenhum', auth_header: '', auth_valor: '', retry_ativo: true, max_tentativas: 3 })
      }
    }
  }, [open, webhook, reset])

  if (!open) return null

  const footerContent = (
    <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
      <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
      <button type="submit" form="wh-saida-form" disabled={isLoading}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Webhook'}
      </button>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={isEditing ? 'Editar Webhook' : 'Novo Webhook de Saída'} description="Webhooks" icon={Send} variant={isEditing ? 'edit' : 'create'} size="lg" footer={footerContent}>
      <form id="wh-saida-form" onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="whs-nome" className="block text-sm font-medium text-foreground mb-1">Nome <span className="text-destructive">*</span></label>
          <input id="whs-nome" {...register('nome')} placeholder="Ex: Notificar ERP"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" aria-invalid={!!errors.nome} />
          {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="whs-desc" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea id="whs-desc" {...register('descricao')} rows={2} placeholder="Descrição opcional"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring resize-none transition-all duration-200" />
        </div>

        {/* URL */}
        <div>
          <label htmlFor="whs-url" className="block text-sm font-medium text-foreground mb-1">URL de destino <span className="text-destructive">*</span></label>
          <input id="whs-url" {...register('url')} placeholder="https://api.exemplo.com/webhook"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring font-mono transition-all duration-200" aria-invalid={!!errors.url} />
          {errors.url && <p className="text-xs text-destructive mt-1">{errors.url.message}</p>}
        </div>

        {/* Eventos */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Eventos <span className="text-destructive">*</span></label>
          <Controller name="eventos" control={control} render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eventoWebhookOptions.map((evento) => {
                const isSelected = field.value.includes(evento.value)
                return (
                  <label key={evento.value}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${
                      isSelected ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span>{evento.label}</span>
                  </label>
                )
              })}
            </div>
          )} />
          {errors.eventos && <p className="text-xs text-destructive mt-1">{errors.eventos.message}</p>}
        </div>

        {/* Autenticação */}
        <div className="space-y-3">
          <label htmlFor="whs-auth" className="block text-sm font-medium text-foreground">Autenticação</label>
          <select id="whs-auth" {...register('auth_tipo')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
            {tipoAuthOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          {authTipo !== 'nenhum' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{authTipo === 'api_key' ? 'Header Name' : authTipo === 'basic' ? 'Usuário' : 'Header'}</label>
                <input {...register('auth_header')} placeholder={authTipo === 'api_key' ? 'X-Api-Key' : authTipo === 'basic' ? 'user' : 'Authorization'}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring font-mono transition-all duration-200" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{authTipo === 'basic' ? 'Senha' : 'Valor'}</label>
                <input {...register('auth_valor')} type="password" placeholder="••••••••"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring font-mono transition-all duration-200" />
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
            <Controller name="retry_ativo" control={control} render={({ field }) => (
              <button type="button" onClick={() => field.onChange(!field.value)}
                className={`relative w-10 h-5 rounded-full transition-colors ${field.value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${field.value ? 'left-5' : 'left-0.5'}`} />
              </button>
            )} />
            {watch('retry_ativo') && (
              <div className="flex items-center gap-1.5">
                <input type="number" {...register('max_tentativas', { valueAsNumber: true })} min={1} max={10}
                  className="w-14 h-10 px-2 text-sm text-center rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" />
                <span className="text-xs text-muted-foreground">tentativas</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </ModalBase>
  )
}
