/**
 * AIDEV-NOTE: Toolbar de ações do módulo Negócios
 * Injeta conteúdo no AppToolbar via context
 * Progressive Disclosure mobile: Busca + CTA visíveis, resto em overflow
 * Inclui FiltrosPopover e PeriodoSelector
 */

import { useEffect, useState, useRef } from 'react'
import { Search, Plus, X, MoreVertical } from 'lucide-react'
import { useAppToolbar } from '@/modules/app/contexts/AppToolbarContext'
import { PipelineSelector } from './PipelineSelector'
import { FiltrosPopover, type FiltrosKanban } from './FiltrosPopover'
import { PeriodoSelector, type PeriodoFiltro } from './PeriodoSelector'
import type { Funil } from '../../services/negocios.api'

interface NegociosToolbarProps {
  funis: Funil[]
  funilAtivo: Funil | null
  onSelectFunil: (funil: Funil) => void
  onNovaPipeline: () => void
  onNovaOportunidade: () => void
  onArquivar?: (funilId: string) => void
  onDesarquivar?: (funilId: string) => void
  onExcluir?: (funilId: string) => void
  busca: string
  onBuscaChange: (value: string) => void
  filtros: FiltrosKanban
  onFiltrosChange: (filtros: FiltrosKanban) => void
  periodo: PeriodoFiltro
  onPeriodoChange: (periodo: PeriodoFiltro) => void
  isAdmin: boolean
}

export function NegociosToolbar({
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
}: NegociosToolbarProps) {
  const { setSubtitle, setActions } = useAppToolbar()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)

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

  // Click outside for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileMenuOpen])

  // Focus search input on open
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchOpen])

  // Inject subtitle (PipelineSelector)
  useEffect(() => {
    setSubtitle(
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
    return () => setSubtitle(null)
  }, [funis, funilAtivo, onSelectFunil, onNovaPipeline, onArquivar, onDesarquivar, onExcluir, isAdmin, setSubtitle])

  // Inject actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-1 sm:gap-1.5">
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
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Oportunidade</span>
        </button>

        {/* Mobile: Icon-only CTA */}
        <button
          onClick={onNovaOportunidade}
          className="sm:hidden p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200"
          title="Nova Oportunidade"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Mobile overflow menu */}
        <div className="relative sm:hidden" ref={menuContainerRef}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-all duration-200"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-[60] py-1 animate-enter">
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onNovaPipeline()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Nova Pipeline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
    return () => setActions(null)
  }, [busca, searchOpen, mobileMenuOpen, isAdmin, setActions, onNovaOportunidade, onNovaPipeline, onBuscaChange, filtros, onFiltrosChange, periodo, onPeriodoChange])

  return null // Renderiza via context
}
