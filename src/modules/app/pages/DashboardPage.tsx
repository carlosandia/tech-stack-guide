import { forwardRef, useState } from 'react'

import { useRelatorioFunil, useFunis, useDashboardMetricasGerais, useMetricasAtendimento, useRelatorioMetas } from '../hooks/useRelatorioFunil'
import { useDashboardDisplay } from '../hooks/useDashboardDisplay'
import DashboardFilters from '../components/dashboard/DashboardFilters'
import FunilConversao from '../components/dashboard/FunilConversao'
import KPIsPrincipais from '../components/dashboard/KPIsPrincipais'
import KPIsSecundarios from '../components/dashboard/KPIsSecundarios'
import MotivosPerda from '../components/dashboard/MotivosPerda'
import MotivosGanho from '../components/dashboard/MotivosGanho'
import ProdutosRanking from '../components/dashboard/ProdutosRanking'
import BreakdownCanal from '../components/dashboard/BreakdownCanal'
import InvestModeWidget from '../components/dashboard/InvestModeWidget'
import DashboardDisplayConfig from '../components/dashboard/DashboardDisplayConfig'
import SectionHideButton from '../components/dashboard/SectionHideButton'
import MetricasAtendimento from '../components/dashboard/MetricasAtendimento'
import IndicadoresReunioes from '../components/dashboard/IndicadoresReunioes'
import RelatorioMetas from '../components/dashboard/RelatorioMetas'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import { AlertCircle } from 'lucide-react'
import type { Periodo } from '../types/relatorio.types'

/**
 * AIDEV-NOTE: Dashboard analítico do CRM (PRD-18)
 * Substituiu o placeholder anterior com dados reais via Supabase RPC
 */

const DashboardPage = forwardRef<HTMLDivElement>(function DashboardPage(_props, ref) {

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

  // Display config
  const { config: displayConfig, toggleSection } = useDashboardDisplay()

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

  const {
    data: metricasAtendimento,
    isLoading: isLoadingAtendimento,
  } = useMetricasAtendimento(query)

  const {
    data: relatorioMetas,
  } = useRelatorioMetas(query)

  const handleDatasChange = (inicio: string, fim: string) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }

  const isLoading = isLoadingRelatorio || isLoadingMetricas || isLoadingAtendimento

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

  return (
    <div ref={ref} className="h-full overflow-y-auto">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-5 max-w-full">
        {/* Header compacto + Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              Relatório de Desempenho
            </h2>
            {/* Investimento + Exibição — sempre visíveis no header */}
            <div className="flex items-center gap-2">
              <InvestModeWidget data={relatorio} />
              <DashboardDisplayConfig config={displayConfig} onToggle={toggleSection} />
            </div>
          </div>
          {/* Filtros abaixo do título em mobile */}
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

        {/* Indicadores de Metas */}
        {displayConfig.metas && relatorioMetas && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="metas" onHide={toggleSection} />
            </div>
            <RelatorioMetas data={relatorioMetas} />
          </div>
        )}

        {/* Funil de Conversão */}
        {displayConfig.funil && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="funil" onHide={toggleSection} />
            </div>
            <FunilConversao data={relatorio} />
          </div>
        )}

        {/* Indicadores de Reuniões */}
        {displayConfig.reunioes && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="reunioes" onHide={toggleSection} />
            </div>
            <IndicadoresReunioes data={relatorio} />
          </div>
        )}

        {/* KPIs Principais (6 cards) */}
        {displayConfig['kpis-principais'] && metricasGerais && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="kpis-principais" onHide={toggleSection} />
            </div>
            <KPIsPrincipais relatorio={relatorio} metricas={metricasGerais} />
          </div>
        )}

        {/* KPIs Secundários (4 cards) */}
        {metricasGerais && (
          <KPIsSecundarios relatorio={relatorio} metricas={metricasGerais} />
        )}

        {/* Breakdown por Canal */}
        {displayConfig.canal && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="canal" onHide={toggleSection} />
            </div>
            <BreakdownCanal data={relatorio.breakdown_canal} />
          </div>
        )}

        {/* Motivos de Ganho + Perda */}
        {displayConfig.motivos && metricasGerais && (
          <div className="relative">
            <div className="absolute top-1 right-2 z-10">
              <SectionHideButton sectionId="motivos" onHide={toggleSection} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MotivosGanho data={metricasGerais.motivos_ganho} />
              <MotivosPerda data={metricasGerais.motivos_perda} />
            </div>
          </div>
        )}

        {/* Produtos Mais Vendidos */}
        {metricasGerais && (
          <ProdutosRanking data={metricasGerais.produtos_ranking} />
        )}

        {/* Métricas de Atendimento */}
        {metricasAtendimento && (
          <MetricasAtendimento data={metricasAtendimento} />
        )}
      </div>
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
