/**
 * AIDEV-NOTE: Popover para escolher quais métricas exibir no painel
 * Conforme PRD-07 RF-15.4
 * Persistência em localStorage por pipeline
 */

import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'

export interface MetricasVisiveis {
  [metricaId: string]: boolean
}

const TODAS_METRICAS = [
  { id: 'total', label: 'Total', grupo: 'Contagem' },
  { id: 'abertas', label: 'Abertas', grupo: 'Contagem' },
  { id: 'ganhas', label: 'Ganhas', grupo: 'Contagem' },
  { id: 'perdidas', label: 'Perdidas', grupo: 'Contagem' },
  { id: 'valor_pipeline', label: 'Valor Pipeline', grupo: 'Financeiro' },
  { id: 'valor_ganho', label: 'Valor Ganho', grupo: 'Financeiro' },
  { id: 'ticket_medio', label: 'Ticket Médio', grupo: 'Financeiro' },
  { id: 'conversao', label: 'Conversão', grupo: 'Performance' },
  { id: 'forecast', label: 'Forecast', grupo: 'Financeiro' },
  { id: 'tempo_medio', label: 'Tempo Médio', grupo: 'Performance' },
  { id: 'stagnadas', label: 'Estagnadas', grupo: 'Alertas' },
  { id: 'vencendo', label: 'Vencendo 7d', grupo: 'Alertas' },
  { id: 'atrasadas', label: 'Atrasadas', grupo: 'Alertas' },
]

const GRUPOS = ['Contagem', 'Financeiro', 'Performance', 'Alertas']

const STORAGE_PREFIX = 'negocios_metricas_visiveis_'

export function getMetricasVisiveis(funilId: string | null): MetricasVisiveis {
  if (!funilId) return {}
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${funilId}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {}
    }
  }
  // Default: todas visíveis
  return {}
}

export function isMetricaVisivel(visiveis: MetricasVisiveis, metricaId: string): boolean {
  // Se não há preferência salva, mostra todas
  if (Object.keys(visiveis).length === 0) return true
  return visiveis[metricaId] !== false
}

interface FiltrarMetricasPopoverProps {
  funilId: string | null
  visiveis: MetricasVisiveis
  onChange: (visiveis: MetricasVisiveis) => void
}

export function FiltrarMetricasPopover({ funilId, visiveis, onChange }: FiltrarMetricasPopoverProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleToggle = (metricaId: string) => {
    const novoEstado = { ...visiveis }
    // Se está vazio, inicializar com tudo true exceto este
    if (Object.keys(novoEstado).length === 0) {
      TODAS_METRICAS.forEach(m => {
        novoEstado[m.id] = m.id !== metricaId
      })
    } else {
      novoEstado[metricaId] = !isMetricaVisivel(visiveis, metricaId)
    }

    // Salvar em localStorage
    if (funilId) {
      localStorage.setItem(`${STORAGE_PREFIX}${funilId}`, JSON.stringify(novoEstado))
    }
    onChange(novoEstado)
  }

  const handleMostrarTodas = () => {
    const novoEstado: MetricasVisiveis = {}
    if (funilId) {
      localStorage.removeItem(`${STORAGE_PREFIX}${funilId}`)
    }
    onChange(novoEstado)
  }

  const totalVisiveis = TODAS_METRICAS.filter(m => isMetricaVisivel(visiveis, m.id)).length
  const temFiltro = Object.keys(visiveis).length > 0

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`
          p-1 rounded transition-all duration-200
          ${temFiltro
            ? 'text-primary hover:bg-primary/10'
            : 'text-muted-foreground hover:bg-accent'
          }
        `}
        title="Filtrar métricas"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-[60] animate-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              Métricas ({totalVisiveis}/{TODAS_METRICAS.length})
            </span>
            {temFiltro && (
              <button
                onClick={handleMostrarTodas}
                className="text-[10px] text-primary hover:underline"
              >
                Mostrar todas
              </button>
            )}
          </div>

          {/* Groups */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {GRUPOS.map(grupo => {
              const metricas = TODAS_METRICAS.filter(m => m.grupo === grupo)
              return (
                <div key={grupo}>
                  <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {grupo}
                  </div>
                  {metricas.map(m => {
                    const ativo = isMetricaVisivel(visiveis, m.id)
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleToggle(m.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-all duration-200"
                      >
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                          ${ativo
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input'
                          }
                        `}>
                          {ativo && <Check className="w-3 h-3" />}
                        </div>
                        <span className={ativo ? 'text-foreground' : 'text-muted-foreground'}>
                          {m.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
