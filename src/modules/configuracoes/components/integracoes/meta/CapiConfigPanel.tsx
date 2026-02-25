/**
 * AIDEV-NOTE: Painel Conversions API (CAPI)
 * Conforme PRD-08 Seção 3 - Configuração de eventos e pixel
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Activity, TestTube, CheckCircle2, XCircle, BarChart } from 'lucide-react'
import { toast } from 'sonner'
import { metaAdsApi } from '../../../services/configuracoes.api'

interface EventoConfig {
  key: string
  label: string
  descricao: string
  metaEvent: string
}

const EVENTOS: EventoConfig[] = [
  { key: 'lead', label: 'Lead', descricao: 'Quando uma oportunidade é criada no CRM', metaEvent: 'Lead' },
  { key: 'schedule', label: 'Agendamento', descricao: 'Quando uma reunião é agendada', metaEvent: 'Schedule' },
  { key: 'mql', label: 'Lead Qualificado (MQL)', descricao: 'Quando uma oportunidade é marcada como MQL', metaEvent: 'CompleteRegistration' },
  { key: 'won', label: 'Oportunidade Ganha', descricao: 'Oportunidade marcada como ganha', metaEvent: 'Purchase' },
  { key: 'lost', label: 'Oportunidade Perdida', descricao: 'Oportunidade marcada como perdida', metaEvent: 'Other' },
]

export function CapiConfigPanel() {
  const queryClient = useQueryClient()
  const [pixelId, setPixelId] = useState('')
  const [eventosHabilitados, setEventosHabilitados] = useState<Record<string, boolean>>({})
  const [enviarValorWon, setEnviarValorWon] = useState(true)

  const { data: config, isLoading } = useQuery({
    queryKey: ['meta-ads', 'capi-config'],
    queryFn: () => metaAdsApi.obterCapiConfig(),
  })

  useEffect(() => {
    if (config) {
      setPixelId(config.pixel_id || '')
      setEventosHabilitados(config.eventos_habilitados || {})
      setEnviarValorWon(config.config_eventos?.won?.enviar_valor ?? true)
    }
  }, [config])

  // AIDEV-NOTE: Derivado do config do banco - botão teste só habilita após salvar
  const configSalva = !!config?.pixel_id

  const salvar = useMutation({
    mutationFn: () =>
      metaAdsApi.salvarCapiConfig({
        pixel_id: pixelId,
        eventos_habilitados: eventosHabilitados,
        config_eventos: { won: { enviar_valor: enviarValorWon } },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'capi-config'] })
      toast.success('Configuração CAPI salva com sucesso')
    },
    onError: () => toast.error('Erro ao salvar configuração'),
  })

  const testar = useMutation({
    mutationFn: () => metaAdsApi.testarCapi(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meta-ads', 'capi-config'] })
      if (data.sucesso) {
        toast.success('mensagem' in data && data.mensagem ? data.mensagem : 'Evento de teste enviado com sucesso!')
      } else {
        toast.error('erro' in data && data.erro ? data.erro : 'Falha no envio do evento de teste')
      }
    },
    onError: (err: Error) => {
      const msg = err.message || 'Erro ao testar Conversions API'
      toast.error(msg, { duration: msg.length > 100 ? 12000 : 5000 })
    },
  })

  const toggleEvento = (key: string) => {
    setEventosHabilitados((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pixel ID */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Pixel ID</label>
        <input
          type="text"
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          placeholder="Ex: 123456789012345"
          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Encontre o Pixel ID no Gerenciador de Eventos do Meta Business Suite
        </p>
      </div>

      {/* Eventos */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Eventos de Conversão</h4>
        <div className="space-y-2">
          {EVENTOS.map((evento) => (
            <div
              key={evento.key}
              className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/30 transition-colors"
            >
              <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={eventosHabilitados[evento.key] ?? true}
                  onChange={() => toggleEvento(evento.key)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{evento.label}</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {evento.metaEvent}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{evento.descricao}</p>
                {evento.key === 'won' && eventosHabilitados['won'] && (
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={enviarValorWon}
                      onChange={(e) => setEnviarValorWon(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-foreground">Enviar valor da oportunidade</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      {config && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Estatísticas (últimos 30 dias)
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Enviados</p>
              <p className="text-lg font-semibold text-foreground">{config.total_eventos_enviados || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sucesso</p>
              <p className="text-lg font-semibold text-foreground">{config.total_eventos_sucesso || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa</p>
              <p className="text-lg font-semibold text-foreground">
                {config.total_eventos_enviados
                  ? `${Math.round(((config.total_eventos_sucesso || 0) / config.total_eventos_enviados) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>
          {config.ultimo_teste !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              {config.ultimo_teste_sucesso ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success-foreground))]" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive" />
              )}
              <p className="text-xs text-muted-foreground">
                Último teste:{' '}
                {config.ultimo_teste
                  ? new Date(config.ultimo_teste).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => testar.mutate()}
          disabled={testar.isPending || !configSalva}
          title={!configSalva ? 'Salve a configuração primeiro' : undefined}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testar.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <TestTube className="w-3.5 h-3.5" />
          )}
          Enviar Evento Teste
        </button>
        <button
          onClick={() => salvar.mutate()}
          disabled={salvar.isPending || !pixelId}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {salvar.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Activity className="w-3.5 h-3.5" />
          )}
          Salvar Configuração
        </button>
      </div>
    </div>
  )
}
