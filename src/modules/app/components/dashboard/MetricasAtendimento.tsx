/**
 * AIDEV-NOTE: Métricas de Atendimento no Dashboard (PRD-18)
 * Dados vindos da RPC fn_metricas_atendimento (conversas + mensagens)
 * Com filtro por canal (WhatsApp / Instagram / Todos)
 */

import { useState } from 'react'
import { MessageSquare, Send, Inbox, Clock, AlertTriangle, MessageCircle } from 'lucide-react'
import type { FunilQuery } from '../../types/relatorio.types'
import { useMetricasAtendimento } from '../../hooks/useRelatorioFunil'

type CanalFiltro = 'todos' | 'whatsapp' | 'instagram'

interface Props {
  query: FunilQuery
}

function formatarTempo(segundos: number | null): string {
  if (!segundos || segundos <= 0) return '—'
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor(segundos % 60)
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function CardAlerta({
  label,
  valor,
  tooltip,
  icon: Icon,
  variant = 'amber',
}: {
  label: string
  valor: string
  tooltip: string
  icon: React.ElementType
  variant?: 'amber' | 'red'
}) {
  const bgClass = variant === 'red'
    ? 'bg-destructive/10 border-destructive/20'
    : 'bg-[hsl(38,92%,50%)]/10 border-[hsl(38,92%,50%)]/20'
  const iconClass = variant === 'red'
    ? 'text-destructive'
    : 'text-[hsl(38,92%,50%)]'

  return (
    <div className={`rounded-lg border p-4 ${bgClass} cursor-help transition-colors`} title={tooltip}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{valor}</p>
    </div>
  )
}

function CardCompacto({
  label,
  valor,
  tooltip,
  icon: Icon,
}: {
  label: string
  valor: string | number
  tooltip: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 cursor-help transition-colors" title={tooltip}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{valor}</p>
    </div>
  )
}

const CANAL_OPTIONS: { value: CanalFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
]

export default function MetricasAtendimento({ query }: Props) {
  const [canal, setCanal] = useState<CanalFiltro>('todos')

  const canalParam = canal === 'todos' ? undefined : canal
  const { data, isLoading } = useMetricasAtendimento(query, canalParam)

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Indicadores de Atendimento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-border p-4 animate-pulse bg-muted/30 h-20" />
          ))}
        </div>
      </div>
    )
  }

  const showWhatsApp = canal === 'todos' || canal === 'whatsapp'
  const showInstagram = canal === 'todos' || canal === 'instagram'
  const canalCardsCount = (showWhatsApp ? 1 : 0) + (showInstagram ? 1 : 0)
  // 3 base cards + canal cards
  const gridCols = 3 + canalCardsCount

  return (
    <div className="space-y-3">
      {/* Título + Badges de canal */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3
            className="text-sm font-semibold text-foreground cursor-help flex items-center gap-1.5"
            title="Métricas de atendimento via WhatsApp e Instagram no período selecionado"
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            Indicadores de Atendimento
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-5.5">
            Calculado com base no horário comercial e dias úteis configurados · <a href="/configuracoes/config-geral" className="underline hover:text-foreground transition-colors">Configurações</a>
          </p>
        </div>

        <div className="flex items-center gap-1">
          {CANAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCanal(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                canal === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linha 1: Cards de alerta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CardAlerta
          label="1ª Resposta"
          valor={formatarTempo(data.primeira_resposta_media_segundos)}
          tooltip="Tempo médio da 1ª resposta ao cliente. Considera apenas mensagens dentro do horário comercial e dias úteis configurados em Configurações > Config Geral."
          icon={Clock}
          variant="amber"
        />
        <CardAlerta
          label="Tempo Médio Resposta"
          valor={formatarTempo(data.tempo_medio_resposta_segundos)}
          tooltip="Tempo médio de resposta da equipe. Considera apenas mensagens dentro do horário comercial e dias úteis configurados em Configurações > Config Geral."
          icon={Clock}
          variant="amber"
        />
        <CardAlerta
          label="Sem Resposta"
          valor={String(data.sem_resposta)}
          tooltip="Conversas onde o cliente enviou mensagem e ainda não recebeu nenhuma resposta"
          icon={AlertTriangle}
          variant={data.sem_resposta > 0 ? 'red' : 'amber'}
        />
      </div>

      {/* Linha 2: Cards secundários */}
      <div className={`grid grid-cols-2 gap-3 ${
        gridCols === 5 ? 'sm:grid-cols-5' : gridCols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
      }`}>
        <CardCompacto
          label="Total Conversas"
          valor={data.total_conversas.toLocaleString('pt-BR')}
          tooltip="Total de conversas iniciadas no período"
          icon={MessageSquare}
        />
        <CardCompacto
          label="Recebidas"
          valor={data.mensagens_recebidas.toLocaleString('pt-BR')}
          tooltip="Total de mensagens recebidas dos clientes"
          icon={Inbox}
        />
        <CardCompacto
          label="Enviadas"
          valor={data.mensagens_enviadas.toLocaleString('pt-BR')}
          tooltip="Total de mensagens enviadas pela equipe"
          icon={Send}
        />
        {showWhatsApp && (
          <CardCompacto
            label="WhatsApp"
            valor={data.conversas_whatsapp.toLocaleString('pt-BR')}
            tooltip="Conversas via WhatsApp no período"
            icon={MessageCircle}
          />
        )}
        {showInstagram && (
          <CardCompacto
            label="Instagram"
            valor={data.conversas_instagram.toLocaleString('pt-BR')}
            tooltip="Conversas via Instagram no período"
            icon={MessageCircle}
          />
        )}
      </div>
    </div>
  )
}
