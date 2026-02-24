/**
 * AIDEV-NOTE: Aba Tarefas (RF-14.3 Tab 2) - Implementação completa
 * Lista tarefas automáticas + manuais, criar tarefa, marcar concluída
 * Separação visual Pendentes / Concluídas, agrupadas por etapa de origem
 */

import { useState, useCallback, useMemo } from 'react'
import { CheckSquare, Plus, Circle, CheckCircle2, Clock, Trash2, AlertCircle, Loader2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { format, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useTarefasOportunidade,
  useCriarTarefa,
  useAtualizarStatusTarefa,
  useExcluirTarefa,
} from '../../hooks/useDetalhes'
import type { Tarefa } from '../../services/detalhes.api'

interface AbaTarefasProps {
  oportunidadeId: string
  funilId?: string
}

const PRIORIDADE_MAP: Record<string, { label: string; class: string }> = {
  baixa: { label: 'Baixa', class: 'text-muted-foreground' },
  media: { label: 'Média', class: 'text-foreground' },
  alta: { label: 'Alta', class: 'text-amber-600' },
  urgente: { label: 'Urgente', class: 'text-destructive font-semibold' },
}

interface TarefasPorEtapa {
  etapaId: string | null
  etapaNome: string
  tarefas: Tarefa[]
}

function agruparPorEtapa(tarefas: Tarefa[]): TarefasPorEtapa[] {
  const map = new Map<string | null, { nome: string; tarefas: Tarefa[] }>()

  for (const t of tarefas) {
    const key = t.etapa_origem_id || null
    if (!map.has(key)) {
      map.set(key, {
        nome: t.etapa_origem_nome || 'Sem etapa',
        tarefas: [],
      })
    }
    map.get(key)!.tarefas.push(t)
  }

  // Etapas com nome primeiro (ordenado), "Sem etapa" por último
  const groups = Array.from(map.entries()).map(([id, g]) => ({
    etapaId: id,
    etapaNome: g.nome,
    tarefas: g.tarefas,
  }))

  return groups.sort((a, b) => {
    if (!a.etapaId) return 1
    if (!b.etapaId) return -1
    return a.etapaNome.localeCompare(b.etapaNome)
  })
}

export function AbaTarefas({ oportunidadeId, funilId }: AbaTarefasProps) {
  const { data: tarefas, isLoading } = useTarefasOportunidade(oportunidadeId, funilId)
  const criarTarefa = useCriarTarefa()
  const atualizarStatus = useAtualizarStatusTarefa()
  const excluirTarefa = useExcluirTarefa()

  const [showForm, setShowForm] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaData, setNovaData] = useState('')
  const [novaPrioridade, setNovaPrioridade] = useState('media')

  const pendentes = useMemo(() => tarefas?.filter(t => t.status !== 'concluida') || [], [tarefas])
  const concluidas = useMemo(() => tarefas?.filter(t => t.status === 'concluida') || [], [tarefas])

  // Agrupar pendentes por etapa apenas se existem tarefas com etapa
  const temEtapas = useMemo(() => pendentes.some(t => t.etapa_origem_id), [pendentes])
  const gruposPendentes = useMemo(() => temEtapas ? agruparPorEtapa(pendentes) : null, [pendentes, temEtapas])

  const handleCriar = useCallback(async () => {
    if (!novoTitulo.trim()) return

    try {
      await criarTarefa.mutateAsync({
        oportunidadeId,
        payload: {
          titulo: novoTitulo.trim(),
          prioridade: novaPrioridade,
          data_vencimento: novaData || undefined,
        },
      })
      setNovoTitulo('')
      setNovaData('')
      setNovaPrioridade('media')
      setShowForm(false)
      toast.success('Tarefa criada')
    } catch {
      toast.error('Erro ao criar tarefa')
    }
  }, [novoTitulo, novaData, novaPrioridade, oportunidadeId, criarTarefa])

  const handleToggleStatus = useCallback(async (tarefa: Tarefa) => {
    const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida'
    try {
      await atualizarStatus.mutateAsync({ tarefaId: tarefa.id, status: novoStatus })
    } catch {
      toast.error('Erro ao atualizar tarefa')
    }
  }, [atualizarStatus])

  const handleExcluir = useCallback(async (tarefaId: string) => {
    try {
      await excluirTarefa.mutateAsync(tarefaId)
      toast.success('Tarefa excluída')
    } catch {
      toast.error('Erro ao excluir tarefa')
    }
  }, [excluirTarefa])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + Nova tarefa */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pendentes ({pendentes.length})
        </p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova tarefa
        </button>
      </div>

      {/* Form nova tarefa */}
      {showForm && (
        <div className="p-3 border border-border rounded-lg space-y-2 bg-muted/30">
          <input
            type="text"
            value={novoTitulo}
            onChange={e => setNovoTitulo(e.target.value)}
            placeholder="Título da tarefa..."
            className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleCriar() }}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={novaData}
              onChange={e => setNovaData(e.target.value)}
              className="flex-1 text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={novaPrioridade}
              onChange={e => setNovaPrioridade(e.target.value)}
              className="text-xs bg-background border border-input rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCriar}
              disabled={!novoTitulo.trim() || criarTarefa.isPending}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {criarTarefa.isPending ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista pendentes */}
      {pendentes.length === 0 && !showForm ? (
        <div className="text-center py-4">
          <CheckSquare className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma tarefa pendente</p>
        </div>
      ) : gruposPendentes ? (
        /* Agrupado por etapa */
        <div className="space-y-3">
          {gruposPendentes.map(grupo => (
            <div key={grupo.etapaId || 'sem-etapa'}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Layers className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {grupo.etapaNome}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  ({grupo.tarefas.length})
                </span>
              </div>
              <div className="space-y-1 ml-1 border-l-2 border-border pl-2.5">
                {grupo.tarefas.map(tarefa => (
                  <TarefaItem
                    key={tarefa.id}
                    tarefa={tarefa}
                    onToggle={handleToggleStatus}
                    onExcluir={handleExcluir}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Sem agrupamento */
        <div className="space-y-1">
          {pendentes.map(tarefa => (
            <TarefaItem
              key={tarefa.id}
              tarefa={tarefa}
              onToggle={handleToggleStatus}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      )}

      {/* Lista concluídas */}
      {concluidas.length > 0 && (
        <>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t border-border">
            Concluídas ({concluidas.length})
          </p>
          <div className="space-y-1">
            {concluidas.map(tarefa => (
              <TarefaItem
                key={tarefa.id}
                tarefa={tarefa}
                onToggle={handleToggleStatus}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TarefaItem({ tarefa, onToggle, onExcluir }: {
  tarefa: Tarefa
  onToggle: (t: Tarefa) => void
  onExcluir: (id: string) => void
}) {
  const isConcluida = tarefa.status === 'concluida'
  const isVencida = tarefa.data_vencimento && !isConcluida && isPast(parseISO(tarefa.data_vencimento))
  const prioInfo = PRIORIDADE_MAP[tarefa.prioridade || 'media'] || PRIORIDADE_MAP.media
  const isAuto = !!tarefa.tarefa_template_id

  return (
    <div className={`group flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors ${isConcluida ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(tarefa)}
        className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
      >
        {isConcluida ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${isConcluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {tarefa.titulo}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {isAuto && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              Automática
            </span>
          )}
          <span className={`text-[10px] ${prioInfo.class}`}>{prioInfo.label}</span>
          {tarefa.data_vencimento && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] ${isVencida ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {isVencida ? <AlertCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {format(parseISO(tarefa.data_vencimento), 'dd/MM', { locale: ptBR })}
            </span>
          )}
          {tarefa.owner && (
            <span className="text-[10px] text-muted-foreground">{tarefa.owner.nome}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onExcluir(tarefa.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
