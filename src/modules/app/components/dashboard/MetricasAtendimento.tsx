/**
 * AIDEV-NOTE: Métricas de Atendimento no Dashboard (PRD-18)
 * Dados vindos da RPC fn_metricas_atendimento (conversas + mensagens)
 */

import { MessageSquare, Send, Inbox, Clock, AlertTriangle, MessageCircle } from 'lucide-react'
import type { MetricasAtendimento as MetricasAtendimentoType } from '../../types/relatorio.types'

interface Props {
  data: MetricasAtendimentoType
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

export default function MetricasAtendimento({ data }: Props) {
  return (
    <div className="space-y-3">
      {/* Título da seção */}
      <h3
        className="text-sm font-semibold text-foreground cursor-help flex items-center gap-1.5"
        title="Métricas de atendimento via WhatsApp e Instagram no período selecionado"
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        Atendimento
      </h3>

      {/* Linha 1: Cards de alerta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CardAlerta
          label="1ª Resposta"
          valor={formatarTempo(data.primeira_resposta_media_segundos)}
          tooltip="Tempo médio que sua equipe leva para dar a primeira resposta ao cliente"
          icon={Clock}
          variant="amber"
        />
        <CardAlerta
          label="Tempo Médio Resposta"
          valor={formatarTempo(data.tempo_medio_resposta_segundos)}
          tooltip="Tempo médio para responder durante o horário comercial da empresa"
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        <CardCompacto
          label="WhatsApp"
          valor={data.conversas_whatsapp.toLocaleString('pt-BR')}
          tooltip="Conversas via WhatsApp no período"
          icon={MessageCircle}
        />
        <CardCompacto
          label="Instagram"
          valor={data.conversas_instagram.toLocaleString('pt-BR')}
          tooltip="Conversas via Instagram no período"
          icon={MessageCircle}
        />
      </div>
    </div>
  )
}
