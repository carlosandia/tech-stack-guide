import { TrendingUp, Target, Clock, DollarSign } from 'lucide-react'

/**
 * AIDEV-NOTE: Tab de Relatorios da Organizacao
 * Conforme PRD-14 - RF-012
 *
 * Exibe metricas do tenant:
 * - Total de oportunidades
 * - Taxa de conversao
 * - Valor total
 * - Tempo medio de fechamento
 */

interface Props {
  orgId: string
}

export function OrganizacaoRelatoriosTab({ orgId: _orgId }: Props) {
  // TODO: Implementar hook para buscar metricas do tenant
  // Por enquanto, mostra dados mock
  const metricas = {
    oportunidades: 145,
    taxa_conversao: 32.5,
    valor_total: 450000,
    tempo_medio_dias: 18,
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">
          As metricas abaixo sao consolidadas dos ultimos 30 dias. Para relatorios detalhados,
          acesse o painel da organizacao.
        </p>
      </div>

      {/* Cards de Metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Oportunidades */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{metricas.oportunidades}</p>
          <p className="text-sm text-muted-foreground mt-1">Oportunidades</p>
        </div>

        {/* Taxa de Conversao */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{metricas.taxa_conversao}%</p>
          <p className="text-sm text-muted-foreground mt-1">Taxa de Conversao</p>
        </div>

        {/* Valor Total */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(metricas.valor_total)}</p>
          <p className="text-sm text-muted-foreground mt-1">Valor Total</p>
        </div>

        {/* Tempo Medio */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{metricas.tempo_medio_dias} dias</p>
          <p className="text-sm text-muted-foreground mt-1">Tempo Medio</p>
        </div>
      </div>

      {/* Placeholder para graficos futuros */}
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          Graficos detalhados serao implementados em breve
        </p>
      </div>
    </div>
  )
}
