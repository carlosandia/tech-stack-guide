/**
 * AIDEV-NOTE: Seletor de período para filtrar dados do Kanban
 * Conforme PRD-07 RF-12
 * Presets: Hoje, 7d, Este mês, Mês passado, Personalizado
 */

import { useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar } from 'lucide-react'
import { startOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface PeriodoFiltro {
  inicio?: string
  fim?: string
  preset: string
}

interface PeriodoSelectorProps {
  periodo: PeriodoFiltro
  onChange: (periodo: PeriodoFiltro) => void
}

const PRESETS = [
  { id: 'todos', label: 'Todo período' },
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes_passado', label: 'Mês passado' },
  { id: 'custom', label: 'Personalizado' },
]

function getPresetDates(presetId: string): { inicio?: string; fim?: string } {
  const now = new Date()
  switch (presetId) {
    case 'hoje':
      return {
        inicio: startOfDay(now).toISOString(),
        fim: now.toISOString(),
      }
    case '7d':
      return {
        inicio: subDays(startOfDay(now), 7).toISOString(),
        fim: now.toISOString(),
      }
    case '30d':
      return {
        inicio: subDays(startOfDay(now), 30).toISOString(),
        fim: now.toISOString(),
      }
    case 'mes':
      return {
        inicio: startOfMonth(now).toISOString(),
        fim: now.toISOString(),
      }
    case 'mes_passado': {
      const mesAnterior = subMonths(now, 1)
      return {
        inicio: startOfMonth(mesAnterior).toISOString(),
        fim: endOfMonth(mesAnterior).toISOString(),
      }
    }
    default:
      return {}
  }
}

function getPresetLabel(preset: string): string {
  return PRESETS.find(p => p.id === preset)?.label || 'Todo período'
}

export const PeriodoSelector = forwardRef<HTMLDivElement, PeriodoSelectorProps>(function PeriodoSelector({ periodo, onChange }, _ref) {
  const [open, setOpen] = useState(false)
  const [customInicio, setCustomInicio] = useState('')
  const [customFim, setCustomFim] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, right: 0 })

  // Calcular posição ao abrir
  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen(!open)
  }

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handlePreset = (presetId: string) => {
    if (presetId === 'custom') return // Just show fields

    const dates = getPresetDates(presetId)
    onChange({ ...dates, preset: presetId })
    setOpen(false)
  }

  const handleCustomApply = () => {
    if (!customInicio || !customFim) return
    onChange({
      inicio: new Date(customInicio).toISOString(),
      fim: new Date(customFim + 'T23:59:59').toISOString(),
      preset: 'custom',
    })
    setOpen(false)
  }

  const isActive = periodo.preset !== 'todos' && periodo.preset

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`
          relative p-2 rounded-md transition-all duration-200
          ${isActive
            ? 'text-primary hover:bg-primary/10'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }
        `}
        title={`Período: ${getPresetLabel(periodo.preset)}`}
      >
        <Calendar className="w-4 h-4" />
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      {open && createPortal(
        <>
          {/* Overlay mobile escuro */}
          <div className="fixed inset-0 z-[199] bg-black/40 sm:bg-transparent" onClick={() => setOpen(false)} />
          <div
            ref={dropdownRef}
            className="fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)] max-w-64 z-[200]
                        sm:left-auto sm:translate-x-0 sm:top-auto sm:w-64
                        bg-card border border-border rounded-lg shadow-lg py-1 animate-enter"
            style={{ ...(window.innerWidth >= 640 ? { top: coords.top, right: coords.right, left: 'auto', transform: 'none' } : {}) }}
          >
          {PRESETS.map(preset => (
            <div key={preset.id}>
              {preset.id === 'custom' ? (
                <>
                  <div className="border-t border-border my-1" />
                  <div className="px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Personalizado
                    </span>
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-0.5">De</label>
                        <input
                          type="date"
                          value={customInicio}
                          onChange={(e) => setCustomInicio(e.target.value)}
                          className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-0.5">Até</label>
                        <input
                          type="date"
                          value={customFim}
                          onChange={(e) => setCustomFim(e.target.value)}
                          className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </div>
                      <button
                        onClick={handleCustomApply}
                        disabled={!customInicio || !customFim}
                        className="w-full h-8 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handlePreset(preset.id)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm text-left transition-all duration-200
                    ${periodo.preset === preset.id
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-foreground hover:bg-accent'
                    }
                  `}
                >
                  {preset.label}
                </button>
              )}
            </div>
          ))}
          </div>
        </>
      , document.body)}
    </div>
  )
})
PeriodoSelector.displayName = 'PeriodoSelector'
