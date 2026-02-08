/**
 * AIDEV-NOTE: Painel de métricas de atendimento (Conversas)
 * Mesmo padrão visual do MetricasPanel de Negócios
 * Cards compactos com ícones, filtro de período integrado
 * Layout responsivo: 2 cols mobile, 3 tablet, 5 desktop
 */

import { useState } from 'react'
import {
  Clock, MessageCircle, Send, Inbox, Users, CheckCircle,
  AlertTriangle, BarChart3, Timer, Zap,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { InstagramIcon } from '@/shared/components/InstagramIcon'
import {
  useConversasMetricas,
  formatDuracao,
  type PeriodoMetricas,
  type CanalFiltro,
} from '../hooks/useConversasMetricas'

const PERIODOS: Array<{ value: PeriodoMetricas; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
]

const CANAIS_FILTRO: Array<{ value: CanalFiltro; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
]

interface MetricaCard {
  id: string
  label: string
  valor: string
  icon: React.ElementType
  cor: 'default' | 'success' | 'warning' | 'destructive' | 'primary'
}

const COR_CLASSES: Record<string, string> = {
  default: 'text-foreground bg-muted/50',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
  primary: 'text-primary bg-primary/10',
}

const ICON_COR_CLASSES: Record<string, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  primary: 'text-primary',
}

export function ConversasMetricasPanel() {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('30d')
  const [canal, setCanal] = useState<CanalFiltro>('todos')

  const { data: metricas, isLoading } = useConversasMetricas({
    periodo,
    canal,
  })

  const cards: MetricaCard[] = metricas ? [
    {
      id: 'tmr',
      label: '1ª Resposta',
      valor: formatDuracao(metricas.tempoMedioPrimeiraResposta),
      icon: Zap,
      cor: metricas.tempoMedioPrimeiraResposta !== null && metricas.tempoMedioPrimeiraResposta <= 15
        ? 'success'
        : metricas.tempoMedioPrimeiraResposta !== null && metricas.tempoMedioPrimeiraResposta > 60
          ? 'destructive'
          : 'primary',
    },
    {
      id: 'tma',
      label: 'Tempo Médio Resp.',
      valor: formatDuracao(metricas.tempoMedioResposta),
      icon: Timer,
      cor: metricas.tempoMedioResposta !== null && metricas.tempoMedioResposta <= 30
        ? 'success'
        : metricas.tempoMedioResposta !== null && metricas.tempoMedioResposta > 120
          ? 'warning'
          : 'default',
    },
    {
      id: 'sem_resposta',
      label: 'Sem Resposta',
      valor: String(metricas.conversasSemResposta),
      icon: AlertTriangle,
      cor: metricas.conversasSemResposta > 5 ? 'destructive' : metricas.conversasSemResposta > 0 ? 'warning' : 'success',
    },
    {
      id: 'total',
      label: 'Total Conversas',
      valor: String(metricas.totalConversas),
      icon: MessageCircle,
      cor: 'default',
    },
    {
      id: 'enviadas',
      label: 'Enviadas',
      valor: String(metricas.mensagensEnviadas),
      icon: Send,
      cor: 'default',
    },
    {
      id: 'recebidas',
      label: 'Recebidas',
      valor: String(metricas.mensagensRecebidas),
      icon: Inbox,
      cor: 'default',
    },
    {
      id: 'resolucao',
      label: 'Taxa Resolução',
      valor: `${metricas.taxaResolucao}%`,
      icon: CheckCircle,
      cor: metricas.taxaResolucao >= 80 ? 'success' : metricas.taxaResolucao >= 50 ? 'warning' : 'destructive',
    },
    {
      id: 'tempo_resolucao',
      label: 'Tempo Resolução',
      valor: formatDuracao(metricas.tempoMedioResolucao),
      icon: Clock,
      cor: 'default',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      valor: String(metricas.conversasPorCanal.whatsapp),
      icon: BarChart3,
      cor: 'default',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      valor: String(metricas.conversasPorCanal.instagram),
      icon: BarChart3,
      cor: 'default',
    },
  ] : []

  return (
    <div className="flex-shrink-0 border-b border-border bg-card/50 px-3 sm:px-4 py-3 animate-enter space-y-3">
      {/* Filtros: Período + Canal */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Período chips */}
        <div className="flex items-center gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`
                px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200
                ${periodo === p.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

        {/* Canal chips */}
        <div className="flex items-center gap-1">
          {CANAIS_FILTRO.map((c) => (
            <button
              key={c.value}
              onClick={() => setCanal(c.value)}
              className={`
                flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200
                ${canal === c.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
            >
              {c.value === 'whatsapp' && <WhatsAppIcon size={12} className="text-[#25D366]" />}
              {c.value === 'instagram' && <InstagramIcon size={12} className="text-[#E4405F]" />}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {cards.map((m) => (
            <div
              key={m.id}
              className={`
                flex items-center gap-2 px-2.5 py-2 rounded-lg
                ${COR_CLASSES[m.cor]}
                transition-all duration-200
              `}
            >
              <m.icon className={`w-3.5 h-3.5 flex-shrink-0 ${ICON_COR_CLASSES[m.cor]}`} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-none truncate">
                  {m.label}
                </p>
                <p className="text-sm font-semibold leading-tight mt-0.5 truncate">
                  {m.valor}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top vendedores (se admin e houver dados) */}
      {metricas && metricas.conversasPorVendedor.length > 1 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground overflow-x-auto">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          {metricas.conversasPorVendedor.slice(0, 5).map((v) => (
            <span key={v.usuario_id} className="flex items-center gap-1 whitespace-nowrap">
              <span className="font-medium text-foreground">{v.nome}</span>
              <span className="text-muted-foreground">({v.total})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
