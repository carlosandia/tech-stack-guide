/**
 * AIDEV-NOTE: Página de Webhooks de Saída
 * Conforme PRD-05 - Webhooks de Saída
 * Admin Only - Members bloqueados
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Plus,
  Send,
  Pencil,
  Trash2,
  Play,
  FileText,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  
  ChevronUp,
} from 'lucide-react'
import { useConfigToolbar } from '../contexts/ConfigToolbarContext'
import {
  useWebhooksSaida,
  useCriarWebhookSaida,
  useAtualizarWebhookSaida,
  useExcluirWebhookSaida,
  useTestarWebhookSaida,
  useLogsWebhookSaida,
} from '../hooks/useWebhooks'
import { WebhookSaidaFormModal } from '../components/webhooks/WebhookSaidaFormModal'
import type { WebhookSaida } from '../services/configuracoes.api'
import type { WebhookSaidaFormData } from '../schemas/webhooks.schema'
import { eventoWebhookOptions } from '../schemas/webhooks.schema'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEventoLabel(evento: string): string {
  return eventoWebhookOptions.find((e) => e.value === evento)?.label || evento
}

// Sub-componente para logs inline
function WebhookLogs({ webhookId }: { webhookId: string }) {
  const { data, isLoading } = useLogsWebhookSaida(webhookId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Carregando logs...
      </div>
    )
  }

  const logs = data?.logs || []

  if (logs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground p-3">Nenhum log registrado ainda.</p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {logs.slice(0, 10).map((log) => (
        <div key={log.id} className="flex items-center gap-3 px-3 py-2 text-xs">
          {log.sucesso ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))] flex-shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
          )}
          <span className="text-foreground font-medium">{getEventoLabel(log.evento)}</span>
          <span className="text-muted-foreground">
            {log.status_code ? `HTTP ${log.status_code}` : 'Sem resposta'}
          </span>
          {log.duracao_ms && (
            <span className="text-muted-foreground">{log.duracao_ms}ms</span>
          )}
          <span className="text-muted-foreground ml-auto">{formatDate(log.criado_em)}</span>
          {log.tentativa > 1 && (
            <span className="text-[hsl(var(--warning-foreground))] bg-[hsl(var(--warning-muted))] px-1.5 py-0.5 rounded text-[10px]">
              Tentativa {log.tentativa}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function WebhooksSaidaPage() {
  const { setSubtitle, setActions } = useConfigToolbar()
  const { data, isLoading } = useWebhooksSaida()
  const criar = useCriarWebhookSaida()
  const atualizar = useAtualizarWebhookSaida()
  const excluir = useExcluirWebhookSaida()
  const testar = useTestarWebhookSaida()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookSaida | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    setSubtitle('Envie eventos do CRM para sistemas externos')
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

  const handleSubmit = (formData: WebhookSaidaFormData) => {
    const payload: Record<string, unknown> = {
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      url: formData.url,
      eventos: formData.eventos,
      auth_tipo: formData.auth_tipo,
      auth_header: formData.auth_header || undefined,
      auth_valor: formData.auth_valor || undefined,
      retry_ativo: formData.retry_ativo,
      max_tentativas: formData.max_tentativas,
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

  const handleToggleAtivo = (webhook: WebhookSaida) => {
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
            <Send className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nenhum webhook de saída</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Configure webhooks de saída para enviar eventos do CRM para ERPs, sistemas de BI e outras integrações.
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
              className={`bg-card border rounded-lg transition-colors ${
                webhook.ativo ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="p-5">
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
                      {webhook.retry_ativo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          <RefreshCw className="w-3 h-3 inline mr-0.5" />
                          {webhook.max_tentativas}x retry
                        </span>
                      )}
                    </div>

                    {webhook.descricao && (
                      <p className="text-xs text-muted-foreground mb-2">{webhook.descricao}</p>
                    )}

                    {/* URL */}
                    <code className="text-xs bg-muted px-2 py-1 rounded text-foreground block truncate mb-2">
                      {webhook.url}
                    </code>

                    {/* Eventos */}
                    <div className="flex flex-wrap gap-1.5">
                      {webhook.eventos.map((evento) => (
                        <span
                          key={evento}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {getEventoLabel(evento)}
                        </span>
                      ))}
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
                      onClick={() => testar.mutate(webhook.id)}
                      disabled={testar.isPending}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                      title="Enviar teste"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedLogs(expandedLogs === webhook.id ? null : webhook.id)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                      title="Ver logs"
                    >
                      <FileText className="w-4 h-4" />
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
                          Sim
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

              {/* Logs expandidos */}
              {expandedLogs === webhook.id && (
                <div className="border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground">Últimos Logs</span>
                    <button
                      onClick={() => setExpandedLogs(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  <WebhookLogs webhookId={webhook.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <WebhookSaidaFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        webhook={editing}
        isLoading={criar.isPending || atualizar.isPending}
      />
    </div>
  )
}
