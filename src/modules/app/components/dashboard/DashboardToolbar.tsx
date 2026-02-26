/**
 * AIDEV-NOTE: Toolbar do Dashboard de Relatório (PRD-18)
 * Injeta filtros e ações no AppToolbar via context, seguindo o mesmo padrão de NegociosToolbar
 */

import { useEffect, forwardRef, type RefObject } from 'react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import DashboardFilters from './DashboardFilters'
import InvestModeWidget from './InvestModeWidget'
import DashboardDisplayConfig from './DashboardDisplayConfig'
import DashboardVisualizacoes from './DashboardVisualizacoes'
import ExportarRelatorioPDF from './ExportarRelatorioPDF'
import FullscreenToggle from './FullscreenToggle'
import type { Periodo, FunilOption, RelatorioFunilResponse } from '../../types/relatorio.types'
import type { DashboardDisplayConfig as DisplayConfigType, ToggleableSectionId } from '../../hooks/useDashboardDisplay'
import type { VisualizacaoDashboard } from '../../hooks/useDashboardVisualizacoes'

interface DashboardToolbarProps {
  periodo: Periodo
  onPeriodoChange: (p: Periodo) => void
  funilId: string | undefined
  onFunilChange: (id: string | undefined) => void
  funis: FunilOption[]
  dataInicio?: string
  dataFim?: string
  onDatasChange: (inicio: string, fim: string) => void
  relatorio: RelatorioFunilResponse | undefined
  displayConfig: DisplayConfigType
  onToggleSection: (id: ToggleableSectionId) => void
  onAplicarVisualizacao: (v: VisualizacaoDashboard) => void
  contentRef: RefObject<HTMLDivElement>
  scrollContainerRef: RefObject<HTMLDivElement>
}

export const DashboardToolbar = forwardRef<HTMLDivElement, DashboardToolbarProps>(function DashboardToolbar({
  periodo,
  onPeriodoChange,
  funilId,
  onFunilChange,
  funis,
  dataInicio,
  dataFim,
  onDatasChange,
  relatorio,
  displayConfig,
  onToggleSection,
  onAplicarVisualizacao,
  contentRef,
  scrollContainerRef,
}, _ref) {
  const { setCenterContent, setActions } = useAppToolbar()

  // Inject center content (filters)
  useEffect(() => {
    setCenterContent(
      <DashboardFilters
        periodo={periodo}
        onPeriodoChange={onPeriodoChange}
        funilId={funilId}
        onFunilChange={onFunilChange}
        funis={funis}
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDatasChange={onDatasChange}
      />
    )
    return () => setCenterContent(null)
  }, [periodo, onPeriodoChange, funilId, onFunilChange, funis, dataInicio, dataFim, onDatasChange, setCenterContent])

  // Inject actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
        {relatorio && <InvestModeWidget data={relatorio} />}
        <DashboardDisplayConfig config={displayConfig} onToggle={onToggleSection} />
        <DashboardVisualizacoes
          filtrosAtuais={{
            periodo,
            funil_id: funilId || null,
            data_inicio: dataInicio || null,
            data_fim: dataFim || null,
          }}
          configExibicaoAtual={displayConfig}
          onAplicar={onAplicarVisualizacao}
          funis={funis}
        />
        <ExportarRelatorioPDF
          containerRef={contentRef}
          dashboardPeriodo={periodo}
          dashboardDataInicio={dataInicio}
          dashboardDataFim={dataFim}
        />
        <FullscreenToggle containerRef={scrollContainerRef} />
      </div>
    )
    return () => setActions(null)
  }, [relatorio, displayConfig, onToggleSection, periodo, funilId, dataInicio, dataFim, onAplicarVisualizacao, funis, contentRef, scrollContainerRef, setActions])

  return null // Renderiza via context
})

DashboardToolbar.displayName = 'DashboardToolbar'
