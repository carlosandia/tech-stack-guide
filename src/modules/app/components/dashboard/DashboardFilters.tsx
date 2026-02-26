/**
 * AIDEV-NOTE: Filtros do Dashboard de Relatório (PRD-18)
 * Select de período + Select de funil + DatePicker para período personalizado
 */

import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Periodo, FunilOption } from '../../types/relatorio.types'

interface DashboardFiltersProps {
  periodo: Periodo
  onPeriodoChange: (p: Periodo) => void
  funilId: string | undefined
  onFunilChange: (id: string | undefined) => void
  funis: FunilOption[]
  dataInicio?: string
  dataFim?: string
  onDatasChange: (inicio: string, fim: string) => void
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'personalizado', label: 'Personalizado' },
]

export default function DashboardFilters({
  periodo,
  onPeriodoChange,
  funilId,
  onFunilChange,
  funis,
  dataInicio,
  dataFim,
  onDatasChange,
}: DashboardFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: dataInicio ? new Date(dataInicio) : undefined,
    to: dataFim ? new Date(dataFim) : undefined,
  })

  const handlePeriodoClick = (p: Periodo) => {
    onPeriodoChange(p)
    if (p === 'personalizado') {
      setShowDatePicker(true)
    } else {
      setShowDatePicker(false)
    }
  }

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return
    setDateRange(range)
    if (range.from && range.to) {
      onDatasChange(
        format(range.from, 'yyyy-MM-dd'),
        format(range.to, 'yyyy-MM-dd')
      )
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Período */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 overflow-x-auto max-w-full scrollbar-none">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodoClick(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              periodo === p.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* DatePicker para personalizado */}
      {(periodo === 'personalizado' || showDatePicker) && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                : 'Selecionar datas'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange as { from: Date; to: Date }}
              onSelect={handleDateSelect as never}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Funil */}
      <div className="relative">
        <select
          value={funilId || ''}
          onChange={(e) => onFunilChange(e.target.value || undefined)}
          className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-card border border-border rounded-lg text-foreground cursor-pointer hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os funis</option>
          {funis.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  )
}
