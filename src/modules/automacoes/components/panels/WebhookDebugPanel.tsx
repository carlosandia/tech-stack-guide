/**
 * AIDEV-NOTE: Painel de debug/escuta para trigger webhook_recebido
 * Permite selecionar webhook, copiar URL, escutar eventos de teste e mapear campos
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Copy, Radio, Check, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

// AIDEV-NOTE: Campos do CRM disponíveis para mapeamento
const CAMPOS_CRM = [
  { value: 'contato.nome', label: 'Nome do contato' },
  { value: 'contato.sobrenome', label: 'Sobrenome' },
  { value: 'contato.email', label: 'Email' },
  { value: 'contato.telefone', label: 'Telefone' },
  { value: 'contato.empresa', label: 'Empresa' },
  { value: 'contato.cargo', label: 'Cargo' },
  { value: 'contato.observacoes', label: 'Observações' },
  { value: 'contato.origem', label: 'Origem' },
  { value: 'oportunidade.titulo', label: 'Título da oportunidade' },
  { value: 'oportunidade.valor', label: 'Valor da oportunidade' },
] as const

interface WebhookDebugPanelProps {
  triggerConfig: Record<string, unknown>
  onConfigUpdate: (config: Record<string, unknown>) => void
  organizacaoId: string
}

// AIDEV-NOTE: Timeout máximo de 120s (40 iterações * 3s) para evitar polling infinito
const MAX_POLLING_ITERATIONS = 40

export function WebhookDebugPanel({ triggerConfig, onConfigUpdate, organizacaoId }: WebhookDebugPanelProps) {
  const [listening, setListening] = useState(false)
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastLogIdRef = useRef<string | null>(null)
  const iteracoesRef = useRef(0)

  const selectedWebhookId = triggerConfig.webhook_id as string || ''
  const mapeamento = (triggerConfig.mapeamento || {}) as Record<string, string>

  // AIDEV-NOTE: Usa useQuery com cache em vez de useEffect manual (GAP 7)
  const { data: webhooks = [], isLoading: loading } = useQuery({
    queryKey: ['webhooks-entrada', organizacaoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('webhooks_entrada')
        .select('id, nome, url_token, ativo')
        .eq('organizacao_id', organizacaoId)
        .is('deletado_em', null)
        .order('criado_em', { ascending: false })
      return data || []
    },
    enabled: !!organizacaoId,
    staleTime: 60_000,
  })

  const selectedWebhook = webhooks.find(w => w.id === selectedWebhookId)
  // AIDEV-NOTE: Centralizado via env vars (Auditoria M1)
  const webhookUrl = selectedWebhook
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-entrada/${selectedWebhook.url_token}`
    : ''

  const handleSelectWebhook = (webhookId: string) => {
    onConfigUpdate({ ...triggerConfig, webhook_id: webhookId })
    setLastPayload(null)
    setListening(false)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  const handleCopy = async () => {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stopListening = useCallback(() => {
    setListening(false)
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = null
    iteracoesRef.current = 0
  }, [])

  // AIDEV-NOTE: Polling com timeout de 120s (GAP 6)
  const startListening = useCallback(() => {
    if (!selectedWebhookId) return
    setListening(true)
    setLastPayload(null)
    lastLogIdRef.current = null
    iteracoesRef.current = 0

    const startedAt = new Date().toISOString()

    pollingRef.current = setInterval(async () => {
      iteracoesRef.current++
      if (iteracoesRef.current >= MAX_POLLING_ITERATIONS) {
        stopListening()
        toast.info('Timeout: escuta encerrada após 2 minutos')
        return
      }

      const { data } = await supabase
        .from('webhooks_entrada_logs')
        .select('id, payload, criado_em')
        .eq('webhook_id', selectedWebhookId)
        .gte('criado_em', startedAt)
        .order('criado_em', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && data[0].id !== lastLogIdRef.current) {
        lastLogIdRef.current = data[0].id
        setLastPayload(data[0].payload as Record<string, unknown>)
        stopListening()
      }
    }, 3000)
  }, [selectedWebhookId, stopListening])

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Extrair chaves do payload para mapeamento
  const payloadKeys = lastPayload ? flattenKeys(lastPayload) : []

  const handleMapField = (campoCrm: string, campoPayload: string) => {
    const novoMapeamento = { ...mapeamento }
    if (campoPayload) {
      novoMapeamento[campoCrm] = campoPayload
    } else {
      delete novoMapeamento[campoCrm]
    }
    onConfigUpdate({ ...triggerConfig, mapeamento: novoMapeamento })
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground py-4">Carregando webhooks...</div>
  }

  return (
    <div className="pt-3 border-t border-border space-y-4">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Configuração do Webhook</p>

      {/* Seletor de webhook */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Webhook de entrada</label>
        <select
          value={selectedWebhookId}
          onChange={e => handleSelectWebhook(e.target.value)}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Selecione um webhook</option>
          {webhooks.map(w => (
            <option key={w.id} value={w.id}>
              {w.nome} {!w.ativo ? '(desativado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* URL do webhook */}
      {selectedWebhookId && webhookUrl && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">URL do Webhook</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-3 py-2 text-xs border border-border rounded-md bg-muted text-muted-foreground font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-md border border-border hover:bg-accent transition-colors shrink-0"
              title="Copiar URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      )}

      {/* Botão de escuta */}
      {selectedWebhookId && (
        <div>
          {listening ? (
            <button
              type="button"
              onClick={stopListening}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-md border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguardando dados... Clique para parar
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            >
              <Radio className="w-4 h-4" />
              Escutar Evento de Teste
            </button>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Envie um POST para a URL acima para capturar o payload
          </p>
        </div>
      )}

      {/* Payload recebido */}
      {lastPayload && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Payload recebido</label>
          <pre className="mt-1 p-3 text-[11px] bg-muted rounded-md overflow-auto max-h-48 font-mono text-foreground border border-border">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* Mapeamento de campos */}
      {selectedWebhookId && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Mapeamento de Campos
          </label>
          <p className="text-[10px] text-muted-foreground mb-2">
            Indique qual campo do payload corresponde a cada campo do CRM
          </p>
          <div className="space-y-2">
            {CAMPOS_CRM.map(campo => (
              <div key={campo.value} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-36 shrink-0 truncate" title={campo.label}>
                  {campo.label}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                {payloadKeys.length > 0 ? (
                  <select
                    value={mapeamento[campo.value] || ''}
                    onChange={e => handleMapField(campo.value, e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">— não mapear —</option>
                    {payloadKeys.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={mapeamento[campo.value] || ''}
                    onChange={e => handleMapField(campo.value, e.target.value)}
                    placeholder="nome_do_campo"
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Extrair chaves de um objeto JSON (flatten de 1 nível)
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...flattenKeys(val as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}
