/**
 * AIDEV-NOTE: Dropdown de seleção de pipeline - Versão completa
 * Conforme PRD-07 RF-15.1
 * Features: busca, separação ativas/arquivadas, ações de editar/arquivar/excluir, contadores
 * Mobile: ações sempre visíveis, confirmação de exclusão com contagem de oportunidades
 */

import { useState, useRef, useEffect, useMemo, forwardRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Plus, Layers, Search, Archive, ArchiveRestore, Trash2, ChevronRight, Settings, AlertTriangle } from 'lucide-react'
import type { Funil } from '../../services/negocios.api'
import { negociosApi } from '../../services/negocios.api'

interface PipelineSelectorProps {
  funis: Funil[]
  funilAtivo: Funil | null
  onSelect: (funil: Funil) => void
  onNovaPipeline: () => void
  onArquivar?: (funilId: string) => void
  onDesarquivar?: (funilId: string) => void
  onExcluir?: (funilId: string, pipelineDestinoId?: string) => void
  isAdmin: boolean
}

export const PipelineSelector = forwardRef<HTMLDivElement, PipelineSelectorProps>(function PipelineSelector({
  funis,
  funilAtivo,
  onSelect,
  onNovaPipeline,
  onArquivar,
  onDesarquivar,
  onExcluir,
  isAdmin,
}, _ref) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [showArquivadas, setShowArquivadas] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ funilId: string; nome: string; count: number | null; acao: 'migrar' | 'excluir'; pipelineDestinoId: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Click outside — ignora quando modal de confirmação está aberto
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      // AIDEV-NOTE: Se confirmDelete está ativo, o modal é um Portal fora do containerRef.
      // Ignorar click-outside para não fechar antes do click no botão "Excluir".
      if (confirmDelete) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, confirmDelete])

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

  const handleExcluirClick = async (e: React.MouseEvent, funilId: string, nome: string) => {
    e.stopPropagation()
    setConfirmDelete({ funilId, nome, count: null, acao: 'migrar', pipelineDestinoId: '' })
    try {
      const count = await negociosApi.contarOportunidadesFunil(funilId)
      setConfirmDelete({ funilId, nome, count, acao: count > 0 ? 'migrar' : 'excluir', pipelineDestinoId: '' })
    } catch {
      setConfirmDelete({ funilId, nome, count: 0, acao: 'excluir', pipelineDestinoId: '' })
    }
  }

  const handleConfirmExcluir = () => {
    if (!confirmDelete) return
    const { funilId, acao, pipelineDestinoId } = confirmDelete
    if (acao === 'migrar' && pipelineDestinoId) {
      onExcluir?.(funilId, pipelineDestinoId)
    } else {
      onExcluir?.(funilId)
    }
    setConfirmDelete(null)
    setOpen(false)
    setBusca('')
  }

  // Pipelines disponíveis para migração (exclui a que está sendo excluída)
  const pipelinesDestino = useMemo(() => {
    if (!confirmDelete) return []
    return funis.filter(f => f.id !== confirmDelete.funilId && f.ativo !== false && !f.arquivado && !f.deletado_em)
  }, [funis, confirmDelete])

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
        <>
          {/* Confirmação de exclusão (overlay) */}
          {confirmDelete && ReactDOM.createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setConfirmDelete(null)}
              >
                <div
                  className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm p-5 space-y-4"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground">Excluir pipeline</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tem certeza que deseja excluir <strong>"{confirmDelete.nome}"</strong>?
                      </p>
                      {confirmDelete.count === null ? (
                        <p className="text-xs text-muted-foreground mt-2">Verificando oportunidades...</p>
                      ) : confirmDelete.count > 0 ? (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">
                            Esta pipeline contém <strong>{confirmDelete.count}</strong> oportunidade{confirmDelete.count > 1 ? 's' : ''}.
                          </p>
                          <p className="text-xs font-medium text-foreground mt-3 mb-2">O que fazer com as oportunidades?</p>
                          
                          {/* Opção: Migrar */}
                          <label className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors ${confirmDelete.acao === 'migrar' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                            <input
                              type="radio"
                              name="acao-exclusao"
                              checked={confirmDelete.acao === 'migrar'}
                              onChange={() => setConfirmDelete(prev => prev ? { ...prev, acao: 'migrar' } : null)}
                              className="mt-0.5 accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground">Migrar para outra pipeline</span>
                              {confirmDelete.acao === 'migrar' && (
                                <select
                                  value={confirmDelete.pipelineDestinoId}
                                  onChange={(e) => setConfirmDelete(prev => prev ? { ...prev, pipelineDestinoId: e.target.value } : null)}
                                  className="mt-1.5 w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                                >
                                  <option value="">Selecione uma pipeline</option>
                                  {pipelinesDestino.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </label>

                          {/* Opção: Excluir tudo */}
                          <label className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-colors mt-2 ${confirmDelete.acao === 'excluir' ? 'border-destructive bg-destructive/5' : 'border-border hover:bg-accent'}`}>
                            <input
                              type="radio"
                              name="acao-exclusao"
                              checked={confirmDelete.acao === 'excluir'}
                              onChange={() => setConfirmDelete(prev => prev ? { ...prev, acao: 'excluir' } : null)}
                              className="mt-0.5 accent-destructive"
                            />
                            <div>
                              <span className="text-xs font-medium text-foreground">Excluir todas as oportunidades</span>
                              <p className="text-[11px] text-destructive mt-0.5">Esta ação não pode ser desfeita.</p>
                            </div>
                          </label>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">Esta pipeline não possui oportunidades.</p>
                      )}
                      {(confirmDelete.count === 0 || confirmDelete.count === null) && (
                        <p className="text-xs text-muted-foreground mt-1">Esta ação não pode ser desfeita.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmExcluir}
                      disabled={confirmDelete.count === null || (confirmDelete.acao === 'migrar' && confirmDelete.count > 0 && !confirmDelete.pipelineDestinoId)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>,
            document.body
          )}

          {/* Dropdown */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[calc(100vw-32px)] sm:w-80 bg-card border border-border rounded-lg shadow-lg z-[60] py-1 animate-enter overflow-hidden">
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
                    onExcluir={(e) => handleExcluirClick(e, funil.id, funil.nome)}
                    onConfigurar={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      setBusca('')
                      navigate(`/negocios/pipeline/${funil.id}`)
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
                        onExcluir={(e) => handleExcluirClick(e, funil.id, funil.nome)}
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
        </>
      )}
    </div>
  )
})
PipelineSelector.displayName = 'PipelineSelector'

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
  return (
    <div
      className={`relative group flex items-center w-full ${
        isSelected ? 'bg-primary/5' : 'hover:bg-accent'
      } ${isArquivada ? 'opacity-60' : ''} transition-all duration-200`}
    >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2.5 px-3 py-2 text-sm text-left min-h-[44px] min-w-0"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: funil.cor || '#3B82F6' }}
        />
        <span className={`truncate flex-1 min-w-0 ${isSelected ? 'text-primary font-medium' : 'text-foreground'}`}>{funil.nome}</span>
        {isArquivada && (
          <Archive className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Ações de admin — sempre visíveis no mobile, hover no desktop */}
      {isAdmin && (
        <div className="flex items-center gap-0.5 pr-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          {!isArquivada && onConfigurar && (
            <button
              onClick={onConfigurar}
              title="Editar pipeline"
              className="p-1.5 hover:bg-accent rounded transition-all duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {isArquivada ? (
            <button
              onClick={onDesarquivar}
              title="Desarquivar"
              className="p-1.5 hover:bg-accent rounded transition-all duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <ArchiveRestore className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={onArquivar}
              title="Arquivar"
              className="p-1.5 hover:bg-accent rounded transition-all duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onExcluir}
            title="Excluir"
            className="p-1.5 hover:bg-destructive/10 rounded transition-all duration-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}
    </div>
  )
}
