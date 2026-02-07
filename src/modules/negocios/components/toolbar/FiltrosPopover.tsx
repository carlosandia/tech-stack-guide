/**
 * AIDEV-NOTE: Popover de filtros avançados para o Kanban
 * Conforme PRD-07 RF-12
 * Filtros: Responsável, Qualificação, Valor (range), Origem
 */

import { useState, useRef, useEffect } from 'react'
import { Filter, Loader2 } from 'lucide-react'
import { negociosApi } from '../../services/negocios.api'

export interface FiltrosKanban {
  responsavelId?: string
  qualificacao?: ('lead' | 'mql' | 'sql')[]
  valorMin?: number
  valorMax?: number
  origem?: string
}

interface FiltrosPopoverProps {
  filtros: FiltrosKanban
  onChange: (filtros: FiltrosKanban) => void
  isAdmin: boolean
}

function contarFiltrosAtivos(f: FiltrosKanban): number {
  let count = 0
  if (f.responsavelId) count++
  if (f.qualificacao && f.qualificacao.length > 0) count++
  if (f.valorMin !== undefined || f.valorMax !== undefined) count++
  if (f.origem) count++
  return count
}

export function FiltrosPopover({ filtros, onChange, isAdmin }: FiltrosPopoverProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [membros, setMembros] = useState<Array<{ id: string; nome: string; sobrenome?: string | null }>>([])
  const [carregando, setCarregando] = useState(false)

  // Local state for editing
  const [local, setLocal] = useState<FiltrosKanban>({ ...filtros })

  // Sync local when external changes
  useEffect(() => {
    setLocal({ ...filtros })
  }, [filtros])

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Carregar membros quando abrir (admin only)
  useEffect(() => {
    if (!open || !isAdmin || membros.length > 0) return
    setCarregando(true)
    negociosApi.listarMembros()
      .then(data => setMembros(data as any))
      .catch(console.error)
      .finally(() => setCarregando(false))
  }, [open, isAdmin, membros.length])

  const totalAtivos = contarFiltrosAtivos(filtros)

  const handleAplicar = () => {
    onChange(local)
    setOpen(false)
  }

  const handleLimpar = () => {
    const vazio: FiltrosKanban = {}
    setLocal(vazio)
    onChange(vazio)
  }

  const toggleQualificacao = (q: 'lead' | 'mql' | 'sql') => {
    const atual = local.qualificacao || []
    setLocal({
      ...local,
      qualificacao: atual.includes(q) ? atual.filter(x => x !== q) : [...atual, q],
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`
          relative p-2 rounded-md text-muted-foreground transition-all duration-200
          ${totalAtivos > 0 ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
        `}
        title="Filtros"
      >
        <Filter className="w-4 h-4" />
        {totalAtivos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {totalAtivos}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 sm:absolute sm:left-auto sm:right-0 top-[calc(100%+6px)] sm:top-full sm:mt-1.5 sm:w-80 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Filtros</span>
            {totalAtivos > 0 && (
              <button
                onClick={handleLimpar}
                className="text-xs text-primary hover:underline"
              >
                Limpar tudo
              </button>
            )}
          </div>

          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Responsável (admin only) */}
            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Responsável
                </label>
                {carregando ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <select
                    value={local.responsavelId || ''}
                    onChange={(e) => setLocal({ ...local, responsavelId: e.target.value || undefined })}
                    className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="">Todos</option>
                    {membros.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nome}{m.sobrenome ? ` ${m.sobrenome}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Qualificação */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Qualificação
              </label>
              <div className="flex gap-2">
                {(['lead', 'mql', 'sql'] as const).map(q => {
                  const selecionado = (local.qualificacao || []).includes(q)
                  return (
                    <button
                      key={q}
                      onClick={() => toggleQualificacao(q)}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                        ${selecionado
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent'
                        }
                      `}
                    >
                      {q.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Valor (range) */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Valor (R$)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={local.valorMin ?? ''}
                  onChange={(e) => setLocal({
                    ...local,
                    valorMin: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={local.valorMax ?? ''}
                  onChange={(e) => setLocal({
                    ...local,
                    valorMax: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  className="flex-1 h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Origem
              </label>
              <select
                value={local.origem || ''}
                onChange={(e) => setLocal({ ...local, origem: e.target.value || undefined })}
                className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Todas</option>
                <option value="manual">Manual</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="website">Website</option>
                <option value="indicacao">Indicação</option>
                <option value="leadads">Lead Ads</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleAplicar}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
