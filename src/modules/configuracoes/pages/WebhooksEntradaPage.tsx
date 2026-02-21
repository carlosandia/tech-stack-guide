/**
 * AIDEV-NOTE: Página de Webhooks de Entrada
 * Padrão de mercado: 1 webhook por org, URL + chaves pré-geradas,
 * toggle habilitar/desabilitar, regenerar chaves.
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Webhook,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import {
  useWebhookEntrada,
  useAtualizarWebhookEntrada,
  useRegenerarChavesWebhook,
} from '../hooks/useWebhooks'
import { WebhookInstrucoesModal } from '../components/webhooks/WebhookInstrucoesModal'

export function WebhooksEntradaPage() {
  const { setSubtitle, setActions } = useConfigToolbar()
  const { data: webhook, isLoading } = useWebhookEntrada()
  const atualizar = useAtualizarWebhookEntrada()
  const regenerarChaves = useRegenerarChavesWebhook()

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showInstrucoes, setShowInstrucoes] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  useEffect(() => {
    setSubtitle('Integração via webhooks personalizados')
    setActions(null)
    return () => { setSubtitle(null); setActions(null) }
  }, [setSubtitle, setActions])

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    toast.success('Copiado para a área de transferência')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleToggleAtivo = () => {
    if (!webhook) return
    atualizar.mutate({ id: webhook.id, payload: { ativo: !webhook.ativo } })
  }

  const handleRegenerarChaves = () => {
    if (!webhook) return
    regenerarChaves.mutate(webhook.id)
    setConfirmRegen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!webhook) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Erro ao carregar configuração de webhook.</p>
      </div>
    )
  }

  const webhookUrl = webhook.url_completa || ''
  const maskedApiKey = webhook.api_key ? '•'.repeat(40) : ''
  const maskedSecretKey = webhook.secret_key ? '•'.repeat(40) : ''

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Webhook className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Webhooks</h2>
                <button
                  onClick={() => setShowInstrucoes(!showInstrucoes)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Ver instruções"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Integração via webhooks personalizados
              </p>
            </div>
          </div>

          {/* Badge de status */}
          {webhook.ativo ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              <XCircle className="w-3.5 h-3.5" />
              Desabilitado
            </span>
          )}
        </div>
      </div>

      {/* Webhook URL */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Webhook URL</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 h-10 px-3 flex items-center rounded-md border border-input bg-muted/50 overflow-hidden">
            <code className="text-sm text-foreground font-mono truncate block">{webhookUrl}</code>
          </div>
          <button
            onClick={() => handleCopy(webhookUrl, 'url')}
            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors flex-shrink-0"
            title="Copiar URL"
          >
            {copiedField === 'url' ? (
              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use esta URL em N8N, Zapier, Make.com e outras plataformas para receber leads
        </p>
      </div>

      {/* Toggle Habilitado */}
      <div className="flex items-center justify-between gap-3 py-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Webhook Habilitado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receber leads via webhook de plataformas externas
          </p>
        </div>
        <button
          onClick={handleToggleAtivo}
          disabled={atualizar.isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            webhook.ativo ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              webhook.ativo ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Chave Pública (API Key) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Chave Pública (API Key)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 h-10 px-3 flex items-center rounded-md border border-input bg-muted/50 font-mono overflow-hidden">
            <span className="text-sm text-foreground truncate block">
              {showApiKey ? (webhook.api_key || '') : maskedApiKey}
            </span>
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors flex-shrink-0"
            title={showApiKey ? 'Ocultar' : 'Mostrar'}
          >
            {showApiKey ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => handleCopy(webhook.api_key || '', 'apikey')}
            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors flex-shrink-0"
            title="Copiar"
          >
            {copiedField === 'apikey' ? (
              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Chave de autenticação pública
        </p>
      </div>

      {/* Chave Secreta (Secret Key) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Chave Secreta (Secret Key)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 h-10 px-3 flex items-center rounded-md border border-input bg-muted/50 font-mono overflow-hidden">
            <span className="text-sm text-foreground truncate block">{maskedSecretKey}</span>
          </div>
          <button
            onClick={() => handleCopy(webhook.secret_key || '', 'secret')}
            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors flex-shrink-0"
            title="Copiar"
          >
            {copiedField === 'secret' ? (
              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Chave de autenticação secreta (não compartilhe)
        </p>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowInstrucoes(!showInstrucoes)}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Ver Instruções
        </button>

        {confirmRegen ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerarChaves}
              disabled={regenerarChaves.isPending}
              className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {regenerarChaves.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirmRegen(false)}
              className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRegen(true)}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerar Chaves
          </button>
        )}
      </div>

      {/* Status do Webhook */}
      {webhook.ativo ? (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--success-muted))]">
          <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success-foreground))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[hsl(var(--success-foreground))]">Webhooks ativos</p>
            <p className="text-xs text-[hsl(var(--success-foreground))]/80 mt-0.5">
              Sistema pronto para receber leads de N8N, Zapier, Make.com e outras plataformas
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
          <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Webhooks desabilitados</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Habilite o webhook acima para começar a receber leads de plataformas externas
            </p>
          </div>
        </div>
      )}

      {/* Modal de Instruções */}
      {showInstrucoes && (
        <WebhookInstrucoesModal
          onClose={() => setShowInstrucoes(false)}
          webhookUrl={webhookUrl}
          apiKey={webhook.api_key || ''}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Configure suas integrações para receber leads automaticamente
      </p>
    </div>
  )
}

export default WebhooksEntradaPage
