/**
 * AIDEV-NOTE: Painel de métricas de email marketing/comercial
 * Mesmo padrão visual do ConversasMetricasPanel
 * 10 cards com ícones, filtro de período, layout responsivo
 */

import { useState } from 'react'
import {
  Send, Inbox, Mail, MailOpen, Clock, AlertTriangle,
  Paperclip, Star, FileText, Zap,
} from 'lucide-react'
import {
  useEmailsMetricas,
  formatDuracao,
  type PeriodoMetricas,
} from '../hooks/useEmailsMetricas'

const PERIODOS: Array<{ value: PeriodoMetricas; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
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

export function EmailsMetricasPanel() {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('30d')

  const { data: metricas, isLoading } = useEmailsMetricas({ periodo })

  const cards: MetricaCard[] = metricas ? [
    {
      id: 'enviados',
      label: 'Enviados',
      valor: String(metricas.emailsEnviados),
      icon: Send,
      cor: 'default',
    },
    {
      id: 'recebidos',
      label: 'Recebidos',
      valor: String(metricas.emailsRecebidos),
      icon: Inbox,
      cor: 'default',
    },
    {
      id: 'taxa_abertura',
      label: 'Taxa Abertura',
      valor: `${metricas.taxaAbertura}%`,
      icon: MailOpen,
      cor: metricas.taxaAbertura >= 40 ? 'success' : metricas.taxaAbertura >= 20 ? 'warning' : 'destructive',
    },
    {
      id: 'total_aberturas',
      label: 'Total Aberturas',
      valor: String(metricas.totalAberturas),
      icon: Mail,
      cor: 'primary',
    },
    {
      id: 'sem_resposta',
      label: 'Sem Resposta',
      valor: String(metricas.semResposta),
      icon: AlertTriangle,
      cor: metricas.semResposta > 10 ? 'destructive' : metricas.semResposta > 0 ? 'warning' : 'success',
    },
    {
      id: 'tempo_resposta',
      label: 'Tempo Resposta',
      valor: formatDuracao(metricas.tempoMedioResposta),
      icon: Clock,
      cor: metricas.tempoMedioResposta !== null && metricas.tempoMedioResposta <= 30
        ? 'success'
        : metricas.tempoMedioResposta !== null && metricas.tempoMedioResposta > 120
          ? 'destructive'
          : 'default',
    },
    {
      id: 'com_anexos',
      label: 'Com Anexos',
      valor: String(metricas.comAnexos),
      icon: Paperclip,
      cor: 'default',
    },
    {
      id: 'favoritos',
      label: 'Favoritos',
      valor: String(metricas.favoritos),
      icon: Star,
      cor: 'default',
    },
    {
      id: 'rascunhos',
      label: 'Rascunhos',
      valor: String(metricas.rascunhos),
      icon: FileText,
      cor: 'default',
    },
    {
      id: 'media_abertura',
      label: '1ª Abertura',
      valor: formatDuracao(metricas.mediaPrimeiraAbertura),
      icon: Zap,
      cor: metricas.mediaPrimeiraAbertura !== null && metricas.mediaPrimeiraAbertura <= 60
        ? 'success'
        : metricas.mediaPrimeiraAbertura !== null && metricas.mediaPrimeiraAbertura > 1440
          ? 'destructive'
          : 'primary',
    },
  ] : []

  return (
    <div className="flex-shrink-0 border-b border-border bg-card/50 px-3 sm:px-4 py-3 animate-enter space-y-3">
      {/* Filtros: Período */}
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
    </div>
  )
}
