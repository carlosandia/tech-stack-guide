/**
 * AIDEV-NOTE: Dropdown de seleção de pipeline - Versão completa
 * Conforme PRD-07 RF-15.1
 * Features: busca, separação ativas/arquivadas, ações de editar/arquivar/excluir, contadores
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Plus, Layers, Search, Archive, ArchiveRestore, Trash2, ChevronRight, Settings } from 'lucide-react'
import type { Funil } from '../../services/negocios.api'

interface PipelineSelectorProps {
  funis: Funil[]
  funilAtivo: Funil | null
  onSelect: (funil: Funil) => void
  onNovaPipeline: () => void
  onArquivar?: (funilId: string) => void
  onDesarquivar?: (funilId: string) => void
  onExcluir?: (funilId: string) => void
  isAdmin: boolean
}

export function PipelineSelector({
  funis,
  funilAtivo,
  onSelect,
  onNovaPipeline,
  onArquivar,
  onDesarquivar,
  onExcluir,
  isAdmin,
}: PipelineSelectorProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [showArquivadas, setShowArquivadas] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  const { ativas, arquivadas } = useMemo(() => {
    const filtrar = (lista: Funil[]) =>
      busca.trim()
        ? lista.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()))
        : lista

    return {
      ativas: filtrar(funis.filter(f => f.ativo !== false && !f.arquivado)),
      arquivadas: filtrar(funis.filter(f => f.arquivado === true)),
    }
  }, [funis, busca])

  const handleArquivar = (e: React.MouseEvent, funilId: string) => {
    e.stopPropagation()
    onArquivar?.(funilId)
  }

  const handleDesarquivar = (e: React.MouseEvent, funilId: string) => {
    e.stopPropagation()
    onDesarquivar?.(funilId)
  }

  const handleExcluir = (e: React.MouseEvent, funilId: string, nome: string) => {
    e.stopPropagation()
    if (confirm(`Excluir pipeline "${nome}"? Esta ação não pode ser desfeita.`)) {
      onExcluir?.(funilId)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent text-sm font-medium text-foreground transition-all duration-200 max-w-[200px]"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: funilAtivo?.cor || '#3B82F6' }}
        />
        <span className="truncate">{funilAtivo?.nome || 'Pipeline'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-[60] py-1 animate-enter">
          {/* Busca */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar pipeline..."
                className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Header ativas */}
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Ativas ({ativas.length})
          </div>

          {/* Lista ativas */}
          {ativas.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              <Layers className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground/50" />
              {busca ? 'Nenhuma pipeline encontrada' : 'Nenhuma pipeline ativa'}
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              {ativas.map(funil => (
                <FunilItem
                  key={funil.id}
                  funil={funil}
                  isSelected={funil.id === funilAtivo?.id}
                  isAdmin={isAdmin}
                  onSelect={() => {
                    onSelect(funil)
                    setOpen(false)
                    setBusca('')
                  }}
                  onArquivar={(e) => handleArquivar(e, funil.id)}
                  onExcluir={(e) => handleExcluir(e, funil.id, funil.nome)}
                  onConfigurar={(e) => {
                    e.stopPropagation()
                    setOpen(false)
                    setBusca('')
                    navigate(`/app/negocios/pipeline/${funil.id}`)
                  }}
                />
              ))}
            </div>
          )}

          {/* Seção arquivadas (colapsável) */}
          {arquivadas.length > 0 && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => setShowArquivadas(!showArquivadas)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:bg-accent transition-all duration-200"
              >
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showArquivadas ? 'rotate-90' : ''}`} />
                Arquivadas ({arquivadas.length})
              </button>

              {showArquivadas && (
                <div className="max-h-[160px] overflow-y-auto">
                  {arquivadas.map(funil => (
                    <FunilItem
                      key={funil.id}
                      funil={funil}
                      isSelected={funil.id === funilAtivo?.id}
                      isAdmin={isAdmin}
                      isArquivada
                      onSelect={() => {
                        onSelect(funil)
                        setOpen(false)
                        setBusca('')
                      }}
                      onDesarquivar={(e) => handleDesarquivar(e, funil.id)}
                      onExcluir={(e) => handleExcluir(e, funil.id, funil.nome)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Ação: Nova Pipeline */}
          {isAdmin && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  setOpen(false)
                  setBusca('')
                  onNovaPipeline()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Nova Pipeline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Sub-componente para cada item de funil
function FunilItem({
  funil,
  isSelected,
  isAdmin,
  isArquivada,
  onSelect,
  onArquivar,
  onDesarquivar,
  onExcluir,
  onConfigurar,
}: {
  funil: Funil
  isSelected: boolean
  isAdmin: boolean
  isArquivada?: boolean
  onSelect: () => void
  onArquivar?: (e: React.MouseEvent) => void
  onDesarquivar?: (e: React.MouseEvent) => void
  onExcluir?: (e: React.MouseEvent) => void
  onConfigurar?: (e: React.MouseEvent) => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        onClick={onSelect}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
          transition-all duration-200
          ${isSelected
            ? 'bg-primary/5 text-primary font-medium'
            : 'text-foreground hover:bg-accent'
          }
          ${isArquivada ? 'opacity-60' : ''}
        `}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: funil.cor || '#3B82F6' }}
        />
        <span className="truncate flex-1">{funil.nome}</span>
        {isArquivada && (
          <Archive className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Ações de admin no hover */}
      {isAdmin && showActions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm px-0.5 py-0.5">
          {!isArquivada && onConfigurar && (
            <button
              onClick={onConfigurar}
              title="Configurar"
              className="p-1 hover:bg-accent rounded transition-all duration-200"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {isArquivada ? (
            <button
              onClick={onDesarquivar}
              title="Desarquivar"
              className="p-1 hover:bg-accent rounded transition-all duration-200"
            >
              <ArchiveRestore className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={onArquivar}
              title="Arquivar"
              className="p-1 hover:bg-accent rounded transition-all duration-200"
            >
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onExcluir}
            title="Excluir"
            className="p-1 hover:bg-destructive/10 rounded transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}
    </div>
  )
}
