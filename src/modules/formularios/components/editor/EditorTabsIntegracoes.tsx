/**
 * AIDEV-NOTE: Tab de Integrações (Webhooks + Pipeline) do editor de formulário
 */

import { useState } from 'react'
import { Loader2, Webhook, Trash2, Power, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useWebhooksFormulario,
  useCriarWebhook,
  useAtualizarWebhook,
  useExcluirWebhook,
} from '../../hooks/useFormularioWebhooks'
import { WebhookFormularioForm } from '../webhooks/WebhookFormularioForm'
import { WebhookFormularioLogs } from '../webhooks/WebhookFormularioLogs'
import type { Formulario } from '../../services/formularios.api'

interface Props {
  formulario: Formulario
}

export function EditorTabsIntegracoes({ formulario }: Props) {
  const { data: webhooks = [], isLoading } = useWebhooksFormulario(formulario.id)
  const criarWebhook = useCriarWebhook(formulario.id)
  const atualizarWebhook = useAtualizarWebhook(formulario.id)
  const excluirWebhook = useExcluirWebhook(formulario.id)

  const [webhookExpandido, setWebhookExpandido] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full">
      {/* Pipeline info */}
      <div className="p-3 rounded-lg border border-border bg-card space-y-2">
        <h4 className="text-xs font-semibold text-foreground">Integração com Pipeline</h4>
        <p className="text-xs text-muted-foreground">
          {formulario.funil_id
            ? 'Formulário configurado para criar oportunidades automaticamente no pipeline.'
            : 'Configure o funil e etapa destino na aba de Configurações para criar oportunidades automaticamente.'}
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            Auto-criar oportunidade:{' '}
            <strong className={formulario.criar_oportunidade_automatico ? 'text-green-600' : 'text-muted-foreground'}>
              {formulario.criar_oportunidade_automatico ? 'Ativo' : 'Inativo'}
            </strong>
          </span>
        </div>
      </div>

      {/* Webhooks */}
      <WebhookFormularioForm
        onCriar={(p) => criarWebhook.mutate(p)}
        loading={criarWebhook.isPending}
      />

      {webhooks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhum webhook configurado
        </p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => {
            const expandido = webhookExpandido === wh.id
            return (
              <div key={wh.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <button
                    onClick={() => setWebhookExpandido(expandido ? null : wh.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {expandido ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <Webhook className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{wh.nome_webhook}</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      wh.ativo ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                    )}>
                      {wh.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => atualizarWebhook.mutate({
                        webhookId: wh.id,
                        payload: { ativo: !wh.ativo } as any,
                      })}
                      title={wh.ativo ? 'Desativar' : 'Ativar'}
                    >
                      <Power className={cn('w-3.5 h-3.5', wh.ativo ? 'text-green-600' : 'text-muted-foreground')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => excluirWebhook.mutate(wh.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {expandido && (
                  <div className="border-t border-border p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">URL:</span>{' '}
                        <span className="font-mono text-[11px] break-all">{wh.url_webhook}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Método:</span>{' '}
                        <span className="font-medium">{wh.metodo_http || 'POST'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Retry:</span>{' '}
                        <span>{wh.retry_ativo ? `Ativo (${wh.max_tentativas || 3}x)` : 'Inativo'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sucesso/Falha:</span>{' '}
                        <span className="text-green-600">{wh.contagem_sucesso || 0}</span>
                        {' / '}
                        <span className="text-destructive">{wh.contagem_falha || 0}</span>
                      </div>
                    </div>

                    <h5 className="text-xs font-semibold text-foreground pt-2">Logs de Execução</h5>
                    <WebhookFormularioLogs webhookId={wh.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
