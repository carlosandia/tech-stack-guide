import { forwardRef, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useRelatorioFunil, useFunis, useDashboardMetricasGerais } from '../hooks/useRelatorioFunil'
import DashboardFilters from '../components/dashboard/DashboardFilters'
import FunilConversao from '../components/dashboard/FunilConversao'
import KPIsPrincipais from '../components/dashboard/KPIsPrincipais'
import KPIsSecundarios from '../components/dashboard/KPIsSecundarios'
import MotivosPerda from '../components/dashboard/MotivosPerda'
import ProdutosRanking from '../components/dashboard/ProdutosRanking'
import BreakdownCanal from '../components/dashboard/BreakdownCanal'
import InvestModeWidget from '../components/dashboard/InvestModeWidget'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import { AlertCircle } from 'lucide-react'
import type { Periodo } from '../types/relatorio.types'

/**
 * AIDEV-NOTE: Dashboard analítico do CRM (PRD-18)
 * Substituiu o placeholder anterior com dados reais via Supabase RPC
 */

const DashboardPage = forwardRef<HTMLDivElement>(function DashboardPage(_props, ref) {
  const { user } = useAuth()

  // Estado dos filtros
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [funilId, setFunilId] = useState<string | undefined>()
  const [dataInicio, setDataInicio] = useState<string>()
  const [dataFim, setDataFim] = useState<string>()

  const query = {
    periodo,
    funil_id: funilId,
    data_inicio: periodo === 'personalizado' ? dataInicio : undefined,
    data_fim: periodo === 'personalizado' ? dataFim : undefined,
  }

  // Queries
  const { data: funis = [] } = useFunis()
  const {
    data: relatorio,
    isLoading: isLoadingRelatorio,
    isError: isErrorRelatorio,
    error: errorRelatorio,
  } = useRelatorioFunil(query)

  const {
    data: metricasGerais,
    isLoading: isLoadingMetricas,
  } = useDashboardMetricasGerais(query)

  const handleDatasChange = (inicio: string, fim: string) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }

  const isLoading = isLoadingRelatorio || isLoadingMetricas

  // Loading
  if (isLoading) {
    return (
      <div ref={ref} className="h-full overflow-y-auto">
        <DashboardSkeleton />
      </div>
    )
  }

  // Error
  if (isErrorRelatorio) {
    return (
      <div ref={ref} className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            Erro ao carregar relatório
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {errorRelatorio?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
        </div>
      </div>
    )
  }

  if (!relatorio) return null

  const periodoLabel = relatorio.periodo.label

  return (
    <div ref={ref} className="h-full overflow-y-auto">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-5 max-w-full">
        {/* Header compacto + Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                Relatório de funil
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Olá, {user?.nome || 'Usuário'} · {periodoLabel}
              </p>
            </div>
            <div className="shrink-0">
              <DashboardFilters
                periodo={periodo}
                onPeriodoChange={setPeriodo}
                funilId={funilId}
                onFunilChange={setFunilId}
                funis={funis}
                dataInicio={dataInicio}
                dataFim={dataFim}
                onDatasChange={handleDatasChange}
              />
            </div>
          </div>
        </div>

        {/* Funil de Conversão */}
        <FunilConversao data={relatorio} />

        {/* Invest Mode */}
        <InvestModeWidget data={relatorio} />

        {/* KPIs Principais (6 cards) */}
        {metricasGerais && (
          <KPIsPrincipais relatorio={relatorio} metricas={metricasGerais} />
        )}

        {/* KPIs Secundários (4 cards) */}
        {metricasGerais && (
          <KPIsSecundarios relatorio={relatorio} metricas={metricasGerais} />
        )}

        {/* Gráficos lado a lado */}
        {metricasGerais && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MotivosPerda data={metricasGerais.motivos_perda} />
            <ProdutosRanking data={metricasGerais.produtos_ranking} />
          </div>
        )}

        {/* Breakdown por Canal */}
        <BreakdownCanal data={relatorio.breakdown_canal} />
      </div>
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
