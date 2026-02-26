import { forwardRef, useState, useRef, useCallback, type DragEvent, type ReactNode } from 'react'

import { useRelatorioFunil, useFunis, useDashboardMetricasGerais, useRelatorioMetas } from '../hooks/useRelatorioFunil'
import { useDashboardDisplay, type SectionId, type ToggleableSectionId } from '../hooks/useDashboardDisplay'
import { DashboardToolbar } from '../components/dashboard/DashboardToolbar'
import FunilConversao from '../components/dashboard/FunilConversao'
import KPIsPrincipais from '../components/dashboard/KPIsPrincipais'
import KPIsSecundarios from '../components/dashboard/KPIsSecundarios'
import MotivosPerda from '../components/dashboard/MotivosPerda'
import MotivosGanho from '../components/dashboard/MotivosGanho'
import ProdutosRanking from '../components/dashboard/ProdutosRanking'
import BreakdownCanal from '../components/dashboard/BreakdownCanal'
import SectionHideButton from '../components/dashboard/SectionHideButton'
import MetricasAtendimento from '../components/dashboard/MetricasAtendimento'
import IndicadoresReunioes from '../components/dashboard/IndicadoresReunioes'
import RelatorioMetas from '../components/dashboard/RelatorioMetas'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import DashboardSectionDraggable from '../components/dashboard/DashboardSectionDraggable'
import { AlertCircle } from 'lucide-react'
import type { Periodo } from '../types/relatorio.types'
import type { VisualizacaoDashboard } from '../hooks/useDashboardVisualizacoes'
import type { DashboardDisplayConfig as DisplayConfigType } from '../hooks/useDashboardDisplay'

/**
 * AIDEV-NOTE: Dashboard analítico do CRM (PRD-18)
 * Toolbar injetado via AppToolbar context (mesmo padrão de NegociosToolbar)
 * Inclui: Visualizações salvas, Export PDF, Fullscreen, Drag & Drop de blocos
 */

const DashboardPage = forwardRef<HTMLDivElement>(function DashboardPage(_props, ref) {
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

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
      const sections: ToggleableSectionId[] = [
        'metas', 'funil', 'reunioes', 'kpis-principais', 'kpis-secundarios',
        'canal', 'motivos', 'produtos', 'atendimento'
      ]
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

  // AIDEV-NOTE: Mapa de seções com visibilidade e componente — todas são toggleáveis
  const sectionMap: Record<SectionId, { visible: boolean; toggleId: ToggleableSectionId; render: () => ReactNode }> = {
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
      visible: displayConfig['kpis-secundarios'] && !!metricasGerais,
      toggleId: 'kpis-secundarios',
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
      visible: displayConfig.produtos && !!metricasGerais,
      toggleId: 'produtos',
      render: () => <ProdutosRanking data={metricasGerais!.produtos_ranking} />,
    },
    atendimento: {
      visible: displayConfig.atendimento,
      toggleId: 'atendimento',
      render: () => <MetricasAtendimento query={query} />,
    },
  }

  const visibleSections = sectionOrder.filter(id => sectionMap[id]?.visible)

  return (
    <div ref={(node) => {
      scrollContainerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref && typeof ref === 'object') {
        ;(ref as { current: HTMLDivElement | null }).current = node
      }
    }} className="h-full overflow-y-auto">
      {/* AIDEV-NOTE: Toolbar injetado via context no AppLayout toolbar sticky */}
      <DashboardToolbar
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        funilId={funilId}
        onFunilChange={setFunilId}
        funis={funis}
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDatasChange={handleDatasChange}
        relatorio={relatorio}
        displayConfig={displayConfig}
        onToggleSection={toggleSection}
        onAplicarVisualizacao={handleAplicarVisualizacao}
        contentRef={contentRef}
        scrollContainerRef={scrollContainerRef}
      />

      <div ref={contentRef} data-dashboard-content className="space-y-6 px-4 sm:px-6 lg:px-8 py-5 max-w-full">
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
                <div className="absolute -top-3 right-3 z-10">
                  <SectionHideButton sectionId={section.toggleId} onHide={toggleSection} />
                </div>
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
