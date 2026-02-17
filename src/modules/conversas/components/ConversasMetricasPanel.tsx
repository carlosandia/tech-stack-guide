/**
 * AIDEV-NOTE: Painel de métricas de atendimento (Conversas)
 * Cards compactos com ícones, filtro de período integrado + personalizado
 * Layout responsivo: 2 cols mobile, 3 tablet, 5 desktop
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Clock, MessageCircle, Send, Inbox, Users, CheckCircle,
  AlertTriangle, Timer, Zap, CalendarIcon, Info, X,
} from 'lucide-react'
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon'
import { InstagramIcon } from '@/shared/components/InstagramIcon'
import {
  useConversasMetricas,
  formatDuracao,
  type PeriodoMetricas,
  type CanalFiltro,
} from '../hooks/useConversasMetricas'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

const PERIODOS: Array<{ value: PeriodoMetricas; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'custom', label: 'Personalizado' },
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
  tooltip: string
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
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('todos')
  const [canal, setCanal] = useState<CanalFiltro>('todos')
  const [customInicio, setCustomInicio] = useState<Date | undefined>()
  const [customFim, setCustomFim] = useState<Date | undefined>()
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [pickingField, setPickingField] = useState<'inicio' | 'fim'>('inicio')

  const { data: metricas, isLoading } = useConversasMetricas({
    periodo,
    canal,
    dataInicio: customInicio?.toISOString(),
    dataFim: customFim?.toISOString(),
  })

  const handlePeriodoClick = (value: PeriodoMetricas) => {
    // AIDEV-NOTE: Clicar no período ativo desseleciona para 'todos' (sem filtro)
    if (value === periodo && value !== 'custom') {
      setPeriodo('todos')
      return
    }
    setPeriodo(value)
    if (value !== 'custom') {
      setCustomInicio(undefined)
      setCustomFim(undefined)
    }
  }

  const handleClearCustom = () => {
    setPeriodo('todos')
    setCustomInicio(undefined)
    setCustomFim(undefined)
    setDatePickerOpen(false)
  }

  const handleCanalClick = (value: CanalFiltro) => {
    // AIDEV-NOTE: Clicar no canal ativo desseleciona para 'todos'
    setCanal(value === canal ? 'todos' : value)
  }

  const cards: MetricaCard[] = metricas ? [
    {
      id: 'tmr',
      label: '1ª Resposta',
      valor: formatDuracao(metricas.tempoMedioPrimeiraResposta),
      icon: Zap,
      tooltip: 'Tempo médio até a primeira resposta do vendedor após mensagem do cliente. Considera apenas conversas individuais.',
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
      tooltip: 'Tempo médio entre cada mensagem do cliente e a resposta do vendedor. Conversas individuais apenas.',
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
      tooltip: 'Conversas individuais sem resposta há mais de 2h ou que nunca receberam resposta do vendedor.',
      cor: metricas.conversasSemResposta > 5 ? 'destructive' : metricas.conversasSemResposta > 0 ? 'warning' : 'success',
    },
    {
      id: 'total',
      label: 'Total Conversas',
      valor: String(metricas.totalConversas),
      icon: MessageCircle,
      tooltip: 'Total de conversas individuais no período. Grupos não são contabilizados.',
      cor: 'default',
    },
    {
      id: 'enviadas',
      label: 'Enviadas',
      valor: String(metricas.mensagensEnviadas),
      icon: Send,
      tooltip: 'Total de mensagens enviadas pelo vendedor em conversas individuais no período.',
      cor: 'default',
    },
    {
      id: 'recebidas',
      label: 'Recebidas',
      valor: String(metricas.mensagensRecebidas),
      icon: Inbox,
      tooltip: 'Total de mensagens recebidas de clientes em conversas individuais no período.',
      cor: 'default',
    },
    {
      id: 'resolucao',
      label: 'Taxa Resolução',
      valor: `${metricas.taxaResolucao}%`,
      icon: CheckCircle,
      tooltip: 'Percentual de conversas individuais fechadas ou resolvidas no período.',
      cor: metricas.taxaResolucao >= 80 ? 'success' : metricas.taxaResolucao >= 50 ? 'warning' : 'destructive',
    },
    {
      id: 'tempo_resolucao',
      label: 'Tempo Resolução',
      valor: formatDuracao(metricas.tempoMedioResolucao),
      icon: Clock,
      tooltip: 'Tempo médio entre a primeira mensagem e o fechamento/resolução da conversa individual.',
      cor: 'default',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      valor: String(metricas.conversasPorCanal.whatsapp),
      icon: WhatsAppIcon,
      tooltip: 'Conversas individuais via WhatsApp no período selecionado.',
      cor: 'default',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      valor: String(metricas.conversasPorCanal.instagram),
      icon: InstagramIcon,
      tooltip: 'Conversas individuais via Instagram no período selecionado.',
      cor: 'default',
    },
  ] : []

  return (
    <div className="flex-shrink-0 border-b border-border bg-card/50 px-3 sm:px-4 py-3 animate-enter space-y-3">
      {/* Filtros: Período + Canal */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Período chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {PERIODOS.map((p) => (
            p.value === 'custom' ? (
              <Popover key={p.value} open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => {
                      handlePeriodoClick('custom')
                      setDatePickerOpen(true)
                    }}
                    className={`
                      flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200
                      ${periodo === 'custom'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }
                    `}
                  >
                    <CalendarIcon className="w-3 h-3" />
                    {periodo === 'custom' && customInicio && customFim
                      ? `${format(customInicio, 'dd/MM', { locale: ptBR })} - ${format(customFim, 'dd/MM', { locale: ptBR })}`
                      : p.label
                    }
                    {periodo === 'custom' && (
                      <X
                        className="w-3 h-3 ml-0.5 hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleClearCustom() }}
                      />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 space-y-3" align="start">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPickingField('inicio')}
                      className={cn(
                        'flex-1 text-xs px-2 py-1.5 rounded border text-left',
                        pickingField === 'inicio' ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <span className="text-muted-foreground block text-[10px]">Início</span>
                      {customInicio ? format(customInicio, 'dd/MM/yyyy') : '--'}
                    </button>
                    <button
                      onClick={() => setPickingField('fim')}
                      className={cn(
                        'flex-1 text-xs px-2 py-1.5 rounded border text-left',
                        pickingField === 'fim' ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <span className="text-muted-foreground block text-[10px]">Fim</span>
                      {customFim ? format(customFim, 'dd/MM/yyyy') : '--'}
                    </button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={pickingField === 'inicio' ? customInicio : customFim}
                    onSelect={(date: Date | undefined) => {
                      if (pickingField === 'inicio') {
                        setCustomInicio(date)
                        setPickingField('fim')
                      } else {
                        setCustomFim(date)
                        if (customInicio && date) setDatePickerOpen(false)
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <button
                key={p.value}
                onClick={() => handlePeriodoClick(p.value)}
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
            )
          ))}
        </div>

        <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

        {/* Canal chips */}
        <div className="flex items-center gap-1">
          {CANAIS_FILTRO.filter(c => c.value !== 'todos').map((c) => (
            <button
              key={c.value}
              onClick={() => handleCanalClick(c.value)}
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
              title={m.tooltip}
              className={`
                group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-default
                ${COR_CLASSES[m.cor]}
                transition-all duration-200
              `}
            >
              <m.icon className={`w-3.5 h-3.5 flex-shrink-0 ${ICON_COR_CLASSES[m.cor]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-muted-foreground leading-none truncate">
                    {m.label}
                  </p>
                  <Info className="w-2.5 h-2.5 text-muted-foreground/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold leading-tight mt-0.5 truncate">
                  {m.valor}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top vendedores */}
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
