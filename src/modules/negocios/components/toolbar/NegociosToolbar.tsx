/**
 * AIDEV-NOTE: Toolbar de ações do módulo Negócios
 * Injeta conteúdo no AppToolbar via context
 * Progressive Disclosure mobile: Busca + CTA visíveis, resto em overflow
 * Inclui FiltrosPopover e PeriodoSelector
 */

import { useEffect, useState, useRef, forwardRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { PipelineSelector } from './PipelineSelector'
import { FiltrosPopover, type FiltrosKanban } from './FiltrosPopover'
import { PeriodoSelector, type PeriodoFiltro } from './PeriodoSelector'
import { FiltrarMetricasPopover, type MetricasVisiveis } from './FiltrarMetricasPopover'
import { MetaToolbarIndicator } from './MetaToolbarIndicator'
import type { Funil } from '../../services/negocios.api'

interface NegociosToolbarProps {
  funis: Funil[]
  funilAtivo: Funil | null
  onSelectFunil: (funil: Funil) => void
  onNovaPipeline: () => void
  onNovaOportunidade: () => void
  onArquivar?: (funilId: string) => void
  onDesarquivar?: (funilId: string) => void
  onExcluir?: (funilId: string, pipelineDestinoId?: string) => void
  busca: string
  onBuscaChange: (value: string) => void
  filtros: FiltrosKanban
  onFiltrosChange: (filtros: FiltrosKanban) => void
  periodo: PeriodoFiltro
  onPeriodoChange: (periodo: PeriodoFiltro) => void
  isAdmin: boolean
  metricasVisivel: boolean
  onToggleMetricas: () => void
  metricasVisiveis: MetricasVisiveis
  onMetricasVisiveisChange: (v: MetricasVisiveis) => void
  funilAtivoId: string | null
}

export const NegociosToolbar = forwardRef<HTMLDivElement, NegociosToolbarProps>(function NegociosToolbar({
  funis,
  funilAtivo,
  onSelectFunil,
  onNovaPipeline,
  onNovaOportunidade,
  onArquivar,
  onDesarquivar,
  onExcluir,
  busca,
  onBuscaChange,
  filtros,
  onFiltrosChange,
  periodo,
  onPeriodoChange,
  isAdmin,
  metricasVisivel,
  onToggleMetricas,
  metricasVisiveis,
  onMetricasVisiveisChange,
  funilAtivoId,
}, _ref) {
  const { setCenterContent, setActions } = useAppToolbar()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Click outside for search
  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  // Focus search input on open
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchOpen])

  // Inject subtitle (PipelineSelector) as center content
  useEffect(() => {
    setCenterContent(
      <PipelineSelector
        funis={funis}
        funilAtivo={funilAtivo}
        onSelect={onSelectFunil}
        onNovaPipeline={onNovaPipeline}
        onArquivar={onArquivar}
        onDesarquivar={onDesarquivar}
        onExcluir={onExcluir}
        isAdmin={isAdmin}
      />
    )
    return () => setCenterContent(null)
  }, [funis, funilAtivo, onSelectFunil, onNovaPipeline, onArquivar, onDesarquivar, onExcluir, isAdmin, setCenterContent])

  // Inject actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Meta indicator */}
        <MetaToolbarIndicator />

        {/* Filtros */}
        <FiltrosPopover
          filtros={filtros}
          onChange={onFiltrosChange}
          isAdmin={isAdmin}
        />

        {/* Período */}
        <PeriodoSelector
          periodo={periodo}
          onChange={onPeriodoChange}
        />

        {/* Métricas (single icon + popover) */}
        <FiltrarMetricasPopover
          funilId={funilAtivoId}
          visiveis={metricasVisiveis}
          onChange={onMetricasVisiveisChange}
          metricasVisivel={metricasVisivel}
          onToggleMetricas={onToggleMetricas}
        />

        {/* Busca (popover) */}
        <div className="relative" ref={searchContainerRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="relative p-2 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
            {busca && !searchOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          {searchOpen && (
            <div className="fixed left-3 right-3 sm:absolute sm:left-auto sm:right-0 top-[calc(100%+6px)] sm:top-full sm:mt-1.5 sm:w-80 bg-card border border-border rounded-lg shadow-lg z-[60] p-3 animate-enter">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={busca}
                  onChange={(e) => onBuscaChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false)
                  }}
                  placeholder="Buscar oportunidades..."
                  className="w-full pl-8 pr-8 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                {busca && (
                  <button
                    onClick={() => onBuscaChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA: Nova Oportunidade */}
        <button
          onClick={onNovaOportunidade}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Nova Oportunidade</span>
          <span className="lg:hidden">Nova</span>
        </button>

        {/* Mobile: Icon-only CTA */}
        <button
          onClick={onNovaOportunidade}
          className="md:hidden p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200"
          title="Nova Oportunidade"
        >
          <Plus className="w-4 h-4" />
        </button>

      </div>
    )
    return () => setActions(null)
  }, [busca, searchOpen, isAdmin, setActions, onNovaOportunidade, onBuscaChange, filtros, onFiltrosChange, periodo, onPeriodoChange, metricasVisivel, onToggleMetricas, metricasVisiveis, onMetricasVisiveisChange, funilAtivoId])

  return null // Renderiza via context
})
NegociosToolbar.displayName = 'NegociosToolbar'
