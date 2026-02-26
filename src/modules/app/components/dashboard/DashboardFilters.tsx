/**
 * AIDEV-NOTE: Filtros do Dashboard de Relatório (PRD-18)
 * Select de período + Select de funil + DatePicker para período personalizado
 */

import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Período */}
      <Select value={periodo} onValueChange={(v) => handlePeriodoClick(v as Periodo)}>
        <SelectTrigger className="h-9 text-xs w-full sm:w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
      <Select value={funilId || 'todos'} onValueChange={(v) => onFunilChange(v === 'todos' ? undefined : v)}>
        <SelectTrigger className="h-9 text-xs w-full sm:w-[180px]">
          <SelectValue placeholder="Todos os funis" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="todos" className="text-xs">Todos os funis</SelectItem>
          {funis.map((f) => (
            <SelectItem key={f.id} value={f.id} className="text-xs">
              {f.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
