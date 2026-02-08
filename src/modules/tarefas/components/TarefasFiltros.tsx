/**
 * AIDEV-NOTE: Barra de filtros do módulo Tarefas (PRD-10)
 * Filtros: Pipeline, Etapa, Status, Prioridade, Responsável (Admin), Período
 * Layout inline desktop, compacto mobile
 */

import { X } from 'lucide-react'
import { useFunisFiltro, useEtapasFiltro, useMembrosEquipe } from '../hooks/useTarefas'
import type { StatusTarefa, PrioridadeTarefa } from '../services/tarefas.api'

const STATUS_OPTIONS: { value: StatusTarefa; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
]

const PRIORIDADE_OPTIONS: { value: PrioridadeTarefa; label: string; cor: string }[] = [
  { value: 'baixa', label: 'Baixa', cor: 'bg-muted text-muted-foreground' },
  { value: 'media', label: 'Média', cor: 'bg-primary/10 text-primary' },
  { value: 'alta', label: 'Alta', cor: 'bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning-foreground))]' },
  { value: 'urgente', label: 'Urgente', cor: 'bg-destructive/10 text-destructive' },
]

interface FiltrosState {
  pipeline_id?: string
  etapa_id?: string
  status?: StatusTarefa[]
  prioridade?: PrioridadeTarefa[]
  owner_id?: string
  data_inicio?: string
  data_fim?: string
}

interface TarefasFiltrosProps {
  filtros: FiltrosState
  onFiltrosChange: (filtros: FiltrosState) => void
  isAdmin: boolean
}

export function TarefasFiltros({ filtros, onFiltrosChange, isAdmin }: TarefasFiltrosProps) {
  const { data: funis } = useFunisFiltro()
  const { data: etapas } = useEtapasFiltro(filtros.pipeline_id)
  const { data: membros } = useMembrosEquipe()

  const hasFilters = !!(
    filtros.pipeline_id ||
    filtros.etapa_id ||
    (filtros.status && filtros.status.length > 0) ||
    (filtros.prioridade && filtros.prioridade.length > 0) ||
    filtros.owner_id ||
    filtros.data_inicio ||
    filtros.data_fim
  )

  const handleClear = () => {
    onFiltrosChange({})
  }

  const toggleStatus = (status: StatusTarefa) => {
    const current = filtros.status || []
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    onFiltrosChange({ ...filtros, status: next.length > 0 ? next : undefined })
  }

  const togglePrioridade = (prioridade: PrioridadeTarefa) => {
    const current = filtros.prioridade || []
    const next = current.includes(prioridade)
      ? current.filter(p => p !== prioridade)
      : [...current, prioridade]
    onFiltrosChange({ ...filtros, prioridade: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 lg:px-6 py-2 border-b border-border bg-muted/30">
      {/* Pipeline */}
      <select
        value={filtros.pipeline_id || ''}
        onChange={(e) => onFiltrosChange({
          ...filtros,
          pipeline_id: e.target.value || undefined,
          etapa_id: undefined, // Reset etapa ao mudar pipeline
        })}
        className="h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        <option value="">Pipeline</option>
        {(funis || []).map(f => (
          <option key={f.id} value={f.id}>{f.nome}</option>
        ))}
      </select>

      {/* Etapa (dependente de pipeline) */}
      {filtros.pipeline_id && (
        <select
          value={filtros.etapa_id || ''}
          onChange={(e) => onFiltrosChange({ ...filtros, etapa_id: e.target.value || undefined })}
          className="h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Etapa</option>
          {(etapas || []).map(e => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      )}

      {/* Status - toggle buttons */}
      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map(opt => {
          const active = filtros.status?.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={`
                h-7 px-2 text-xs rounded-full border transition-all duration-200
                ${active
                  ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Prioridade - toggle buttons */}
      <div className="flex items-center gap-1">
        {PRIORIDADE_OPTIONS.map(opt => {
          const active = filtros.prioridade?.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => togglePrioridade(opt.value)}
              className={`
                h-7 px-2 text-xs rounded-full border transition-all duration-200
                ${active
                  ? `${opt.cor} border-current/30 font-medium`
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Responsável (Admin only) */}
      {isAdmin && (
        <select
          value={filtros.owner_id || ''}
          onChange={(e) => onFiltrosChange({ ...filtros, owner_id: e.target.value || undefined })}
          className="h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Responsável</option>
          {(membros || []).map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      )}

      {/* Período */}
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={filtros.data_inicio || ''}
          onChange={(e) => onFiltrosChange({ ...filtros, data_inicio: e.target.value || undefined })}
          className="h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
          placeholder="De"
        />
        <span className="text-xs text-muted-foreground">a</span>
        <input
          type="date"
          value={filtros.data_fim || ''}
          onChange={(e) => onFiltrosChange({ ...filtros, data_fim: e.target.value || undefined })}
          className="h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30"
          placeholder="Até"
        />
      </div>

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all duration-200"
        >
          <X className="w-3 h-3" />
          Limpar
        </button>
      )}
    </div>
  )
}
