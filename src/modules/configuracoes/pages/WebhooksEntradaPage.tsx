/**
 * AIDEV-NOTE: Página de Webhooks de Entrada
 * Conforme PRD-05 - Webhooks de Entrada
 * Admin Only - Members bloqueados
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Plus,
  Webhook,
  Copy,
  Check,
  Pencil,
  Trash2,
  RefreshCw,
  Key,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import {
  useWebhooksEntrada,
  useCriarWebhookEntrada,
  useAtualizarWebhookEntrada,
  useExcluirWebhookEntrada,
  useRegenerarTokenWebhook,
} from '../hooks/useWebhooks'
import { WebhookEntradaFormModal } from '../components/webhooks/WebhookEntradaFormModal'
import type { WebhookEntrada } from '../services/configuracoes.api'
import type { WebhookEntradaFormData } from '../schemas/webhooks.schema'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Nunca'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WebhooksEntradaPage() {
  const { setSubtitle, setActions } = useConfigToolbar()
  const { data, isLoading } = useWebhooksEntrada()
  const criar = useCriarWebhookEntrada()
  const atualizar = useAtualizarWebhookEntrada()
  const excluir = useExcluirWebhookEntrada()
  const regenerar = useRegenerarTokenWebhook()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookEntrada | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    setSubtitle('URLs para receber dados de sistemas externos')
    setActions(
      <button
        onClick={() => { setEditing(null); setModalOpen(true) }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Webhook
      </button>
    )
    return () => { setSubtitle(null); setActions(null) }
  }, [setSubtitle, setActions])

  const handleSubmit = (formData: WebhookEntradaFormData) => {
    const payload: Record<string, unknown> = {
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      api_key: formData.api_key || undefined,
      secret_key: formData.secret_key || undefined,
    }

    if (editing) {
      atualizar.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            setModalOpen(false)
            setEditing(null)
          },
        }
      )
    } else {
      criar.mutate(payload, {
        onSuccess: () => {
          setModalOpen(false)
        },
      })
    }
  }

  const handleCopyUrl = (webhook: WebhookEntrada) => {
    const url = webhook.url_completa || webhook.url_token
    navigator.clipboard.writeText(url)
    setCopiedId(webhook.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleAtivo = (webhook: WebhookEntrada) => {
    atualizar.mutate({ id: webhook.id, payload: { ativo: !webhook.ativo } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const webhooks = data?.webhooks || []

  return (
    <div className="space-y-4">
      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
            <Webhook className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nenhum webhook de entrada</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Crie webhooks de entrada para receber dados de formulários, integrações e sistemas externos.
          </p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={`bg-card border rounded-lg p-5 transition-colors ${
                webhook.ativo ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{webhook.nome}</h3>
                    {webhook.ativo ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--success-muted))] text-[hsl(var(--success-foreground))]">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>

                  {webhook.descricao && (
                    <p className="text-xs text-muted-foreground mb-2">{webhook.descricao}</p>
                  )}

                  {/* URL */}
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded text-foreground truncate max-w-md">
                      {webhook.url_completa || webhook.url_token}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(webhook)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copiar URL"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {webhook.api_key && (
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        API Key configurada
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Último request: {formatDate(webhook.ultimo_request_em)}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAtivo(webhook)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                    title={webhook.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {webhook.ativo ? (
                      <ToggleRight className="w-4 h-4 text-[hsl(var(--success))]" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => regenerar.mutate(webhook.id)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                    title="Regenerar Token"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setEditing(webhook); setModalOpen(true) }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {confirmDelete === webhook.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          excluir.mutate(webhook.id)
                          setConfirmDelete(null)
                        }}
                        className="px-2 py-1 text-xs font-medium rounded bg-destructive text-destructive-foreground"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(webhook.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WebhookEntradaFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        webhook={editing}
        isLoading={criar.isPending || atualizar.isPending}
      />
    </div>
  )
}
