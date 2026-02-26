import { forwardRef, useState, useRef, useCallback, type DragEvent, type ReactNode } from 'react'

import { useRelatorioFunil, useFunis, useDashboardMetricasGerais, useMetricasAtendimento, useRelatorioMetas } from '../hooks/useRelatorioFunil'
import { useDashboardDisplay, type SectionId, type ToggleableSectionId } from '../hooks/useDashboardDisplay'
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
import DashboardVisualizacoes from '../components/dashboard/DashboardVisualizacoes'
import ExportarRelatorioPDF from '../components/dashboard/ExportarRelatorioPDF'
import FullscreenToggle from '../components/dashboard/FullscreenToggle'
import DashboardSectionDraggable from '../components/dashboard/DashboardSectionDraggable'
import { AlertCircle } from 'lucide-react'
import type { Periodo } from '../types/relatorio.types'
import type { VisualizacaoDashboard } from '../hooks/useDashboardVisualizacoes'
import type { DashboardDisplayConfig as DisplayConfigType } from '../hooks/useDashboardDisplay'

/**
 * AIDEV-NOTE: Dashboard analítico do CRM (PRD-18)
 * Inclui: Visualizações salvas, Export PDF, Fullscreen, Drag & Drop de blocos
 */

const DashboardPage = forwardRef<HTMLDivElement>(function DashboardPage(_props, ref) {
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Display config + order
  const { config: displayConfig, toggleSection, sectionOrder, reorderSection } = useDashboardDisplay()

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

  // Aplicar visualização salva
  const handleAplicarVisualizacao = useCallback((v: VisualizacaoDashboard) => {
    const f = v.filtros
    if (f.periodo) setPeriodo(f.periodo)
    if (f.funil_id !== undefined) setFunilId(f.funil_id || undefined)
    if (f.data_inicio) setDataInicio(f.data_inicio)
    if (f.data_fim) setDataFim(f.data_fim)

    const cfg = v.config_exibicao as Partial<DisplayConfigType>
    if (cfg) {
      const sections: ToggleableSectionId[] = ['metas', 'funil', 'reunioes', 'kpis-principais', 'canal', 'motivos']
      sections.forEach((key) => {
        if (cfg[key] !== undefined && cfg[key] !== displayConfig[key]) {
          toggleSection(key)
        }
      })
    }
  }, [displayConfig, toggleSection])

  // Drag handlers
  const handleDragStart = useCallback((sectionId: string) => {
    setDraggingId(sectionId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverIndex(null)
  }, [])

  const handleDragOver = useCallback((_e: DragEvent, index: number) => {
    setDragOverIndex(prev => prev === index ? prev : index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((_e: DragEvent, targetIndex: number) => {
    if (draggingId) {
      reorderSection(draggingId as SectionId, targetIndex)
    }
    setDraggingId(null)
    setDragOverIndex(null)
  }, [draggingId, reorderSection])

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

  // AIDEV-NOTE: Mapa de seções com visibilidade e componente
  const sectionMap: Record<SectionId, { visible: boolean; toggleId?: ToggleableSectionId; render: () => ReactNode }> = {
    metas: {
      visible: displayConfig.metas && !!relatorioMetas,
      toggleId: 'metas',
      render: () => <RelatorioMetas data={relatorioMetas!} />,
    },
    funil: {
      visible: displayConfig.funil,
      toggleId: 'funil',
      render: () => <FunilConversao data={relatorio} />,
    },
    reunioes: {
      visible: displayConfig.reunioes,
      toggleId: 'reunioes',
      render: () => <IndicadoresReunioes data={relatorio} />,
    },
    'kpis-principais': {
      visible: displayConfig['kpis-principais'] && !!metricasGerais,
      toggleId: 'kpis-principais',
      render: () => <KPIsPrincipais relatorio={relatorio} metricas={metricasGerais!} />,
    },
    'kpis-secundarios': {
      visible: !!metricasGerais,
      render: () => <KPIsSecundarios relatorio={relatorio} metricas={metricasGerais!} />,
    },
    canal: {
      visible: displayConfig.canal,
      toggleId: 'canal',
      render: () => <BreakdownCanal data={relatorio.breakdown_canal} />,
    },
    motivos: {
      visible: displayConfig.motivos && !!metricasGerais,
      toggleId: 'motivos',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MotivosGanho data={metricasGerais!.motivos_ganho} />
          <MotivosPerda data={metricasGerais!.motivos_perda} />
        </div>
      ),
    },
    produtos: {
      visible: !!metricasGerais,
      render: () => <ProdutosRanking data={metricasGerais!.produtos_ranking} />,
    },
    atendimento: {
      visible: !!metricasAtendimento,
      render: () => <MetricasAtendimento data={metricasAtendimento!} />,
    },
  }

  const visibleSections = sectionOrder.filter(id => sectionMap[id]?.visible)

  return (
    <div ref={ref} className="h-full overflow-y-auto">
      <div ref={contentRef} data-dashboard-content className="space-y-6 px-4 sm:px-6 lg:px-8 py-5 max-w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground leading-tight whitespace-nowrap">
            Relatório de Desempenho
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
            <div className="flex items-center gap-2">
              <InvestModeWidget data={relatorio} />
              <DashboardDisplayConfig config={displayConfig} onToggle={toggleSection} />
              <DashboardVisualizacoes
                filtrosAtuais={{
                  periodo,
                  funil_id: funilId || null,
                  data_inicio: dataInicio || null,
                  data_fim: dataFim || null,
                }}
                configExibicaoAtual={displayConfig}
                onAplicar={handleAplicarVisualizacao}
                funis={funis}
              />
              <ExportarRelatorioPDF
                containerRef={contentRef}
                dashboardPeriodo={periodo}
                dashboardDataInicio={dataInicio}
                dashboardDataFim={dataFim}
              />
              <FullscreenToggle containerRef={contentRef} />
            </div>
          </div>
        </div>

        {/* Blocos com Drag & Drop */}
        {visibleSections.map((sectionId, index) => {
          const section = sectionMap[sectionId]
          return (
            <DashboardSectionDraggable
              key={sectionId}
              sectionId={sectionId}
              index={index}
              draggingId={draggingId}
              dragOverIndex={dragOverIndex}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="relative group">
                {section.toggleId && (
                  <div className="absolute -top-3 right-3 z-10">
                    <SectionHideButton sectionId={section.toggleId} onHide={toggleSection} />
                  </div>
                )}
                {section.render()}
              </div>
            </DashboardSectionDraggable>
          )
        })}

        {/* Drop zone final — última posição */}
        {draggingId && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOverIndex(visibleSections.length)
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(e, visibleSections.length)
            }}
            className={`transition-all duration-200 ease-in-out rounded-lg overflow-hidden ${
              dragOverIndex === visibleSections.length
                ? 'h-14 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center'
                : 'h-8'
            }`}
          >
            {dragOverIndex === visibleSections.length && (
              <span className="text-xs text-primary/50 font-medium select-none">
                Soltar aqui
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
