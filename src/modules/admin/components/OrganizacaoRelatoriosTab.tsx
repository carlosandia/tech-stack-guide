import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign, 
  Users, 
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  BarChart3,
} from 'lucide-react'

/**
 * AIDEV-NOTE: Tab de Relatorios da Organizacao
 * Conforme PRD-14 - RF-015, RF-016
 *
 * Exibe 15 metricas em 5 categorias:
 * - Oportunidades
 * - Conversao
 * - Financeiro
 * - Atividades
 * - Performance
 */

interface Props {
  orgId: string
}

interface MetricasTenant {
  oportunidades: {
    total: number
    abertas: number
    ganhas: number
    perdidas: number
    em_andamento: number
  }
  conversao: {
    taxa_geral: number
    tempo_medio_dias: number
    taxa_por_etapa: Array<{ etapa: string; taxa: number }>
  }
  financeiro: {
    valor_total_ganho: number
    valor_pipeline: number
    ticket_medio: number
  }
  atividades: {
    total_tarefas: number
    tarefas_concluidas: number
    reunioes_realizadas: number
    emails_enviados: number
    ligacoes_realizadas: number
  }
  performance: {
    usuarios_ativos: number
    tempo_resposta_horas: number
  }
}

export function OrganizacaoRelatoriosTab({ orgId }: Props) {
  const { data: metricas, isLoading, error } = useQuery<MetricasTenant>({
    queryKey: ['admin', 'organizacao', orgId, 'metricas'],
    queryFn: async () => {
      // Simula chamada à API - endpoint a ser implementado no backend
      // Por enquanto retorna dados de exemplo
      return {
        oportunidades: {
          total: 245,
          abertas: 48,
          ganhas: 156,
          perdidas: 41,
          em_andamento: 78,
        },
        conversao: {
          taxa_geral: 32.5,
          tempo_medio_dias: 18,
          taxa_por_etapa: [
            { etapa: 'Qualificacao', taxa: 85 },
            { etapa: 'Proposta', taxa: 62 },
            { etapa: 'Negociacao', taxa: 48 },
            { etapa: 'Fechamento', taxa: 32.5 },
          ],
        },
        financeiro: {
          valor_total_ganho: 1250000,
          valor_pipeline: 890000,
          ticket_medio: 8013,
        },
        atividades: {
          total_tarefas: 423,
          tarefas_concluidas: 312,
          reunioes_realizadas: 89,
          emails_enviados: 567,
          ligacoes_realizadas: 234,
        },
        performance: {
          usuarios_ativos: 12,
          tempo_resposta_horas: 4.2,
        },
      }
    },
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive">Erro ao carregar metricas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">
          Metricas consolidadas dos ultimos 30 dias. Para relatorios detalhados e exportacao,
          acesse o painel interno da organizacao.
        </p>
      </div>

      {/* 1. Oportunidades */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Oportunidades</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricaCard
            label="Total"
            value={metricas?.oportunidades.total || 0}
            icon={<Target className="w-4 h-4" />}
            variant="default"
          />
          <MetricaCard
            label="Abertas"
            value={metricas?.oportunidades.abertas || 0}
            icon={<Clock className="w-4 h-4" />}
            variant="warning"
          />
          <MetricaCard
            label="Em Andamento"
            value={metricas?.oportunidades.em_andamento || 0}
            icon={<TrendingUp className="w-4 h-4" />}
            variant="primary"
          />
          <MetricaCard
            label="Ganhas"
            value={metricas?.oportunidades.ganhas || 0}
            icon={<CheckCircle className="w-4 h-4" />}
            variant="success"
          />
          <MetricaCard
            label="Perdidas"
            value={metricas?.oportunidades.perdidas || 0}
            icon={<XCircle className="w-4 h-4" />}
            variant="destructive"
          />
        </div>
      </div>

      {/* 2. Conversao */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Conversao</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Taxa de Conversao</p>
            <p className="text-3xl font-bold text-foreground">{metricas?.conversao.taxa_geral || 0}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tempo Medio (dias)</p>
            <p className="text-3xl font-bold text-foreground">{metricas?.conversao.tempo_medio_dias || 0}</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Conversao por Etapa</p>
            {metricas?.conversao.taxa_por_etapa.map((item) => (
              <div key={item.etapa} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{item.etapa}</span>
                  <span className="text-muted-foreground">{item.taxa}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.taxa}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Financeiro */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Financeiro</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Valor Ganho</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(metricas?.financeiro.valor_total_ganho || 0)}
            </p>
          </div>
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-primary mb-1">Pipeline</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(metricas?.financeiro.valor_pipeline || 0)}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Ticket Medio</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(metricas?.financeiro.ticket_medio || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Atividades */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Atividades</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricaCard
            label="Tarefas Totais"
            value={metricas?.atividades.total_tarefas || 0}
            icon={<CheckCircle className="w-4 h-4" />}
            variant="default"
          />
          <MetricaCard
            label="Concluidas"
            value={metricas?.atividades.tarefas_concluidas || 0}
            icon={<CheckCircle className="w-4 h-4" />}
            variant="success"
          />
          <MetricaCard
            label="Reunioes"
            value={metricas?.atividades.reunioes_realizadas || 0}
            icon={<Calendar className="w-4 h-4" />}
            variant="primary"
          />
          <MetricaCard
            label="Emails"
            value={metricas?.atividades.emails_enviados || 0}
            icon={<Mail className="w-4 h-4" />}
            variant="default"
          />
          <MetricaCard
            label="Ligacoes"
            value={metricas?.atividades.ligacoes_realizadas || 0}
            icon={<Phone className="w-4 h-4" />}
            variant="default"
          />
        </div>
      </div>

      {/* 5. Performance */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Performance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuarios Ativos</p>
              <p className="text-2xl font-bold text-foreground">{metricas?.performance.usuarios_ativos || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Medio de Resposta</p>
              <p className="text-2xl font-bold text-foreground">{metricas?.performance.tempo_resposta_horas || 0}h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para cards de metrica
function MetricaCard({
  label,
  value,
  icon,
  variant = 'default',
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
}) {
  const variantClasses = {
    default: 'bg-muted/50 text-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    destructive: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className={`p-4 rounded-lg ${variantClasses[variant]}`}>
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
