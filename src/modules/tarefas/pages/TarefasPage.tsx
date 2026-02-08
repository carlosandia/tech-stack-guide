/**
 * AIDEV-NOTE: Página principal do módulo de Tarefas (PRD-10)
 * Layout: Toolbar (via context) + Métricas + Filtros + Lista paginada
 * Integração com DetalhesOportunidadeModal ao clicar em oportunidade
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useTarefas, useTarefasMetricas, useConcluirTarefa } from '../hooks/useTarefas'
import { TarefasToolbar } from '../components/TarefasToolbar'
import { TarefasMetricasCards } from '../components/TarefasMetricasCards'
import { TarefasFiltros } from '../components/TarefasFiltros'
import { TarefasList } from '../components/TarefasList'
import { ConcluirTarefaModal } from '../components/ConcluirTarefaModal'
import { DetalhesOportunidadeModal } from '@/modules/negocios/components/detalhes/DetalhesOportunidadeModal'
import type { TarefaComDetalhes, StatusTarefa, PrioridadeTarefa } from '../services/tarefas.api'
import { supabase } from '@/lib/supabase'


type FiltroRapido = 'em_aberto' | 'atrasadas' | 'concluidas' | null

interface FiltrosState {
  pipeline_id?: string
  etapa_id?: string
  status?: StatusTarefa[]
  prioridade?: PrioridadeTarefa[]
  owner_id?: string
  data_inicio?: string
  data_fim?: string
}

export default function TarefasPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  // State
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [filtros, setFiltros] = useState<FiltrosState>({})
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>(null)
  const [page, setPage] = useState(1)
  const [concluirTarefa, setConcluirTarefa] = useState<TarefaComDetalhes | null>(null)

  // Modal oportunidade
  const [detalhesOpId, setDetalhesOpId] = useState<string | null>(null)
  const [detalhesOpFunilId, setDetalhesOpFunilId] = useState<string | null>(null)
  const [detalhesOpEtapas, setDetalhesOpEtapas] = useState<any[]>([])

  // Debounce busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [filtros, filtroRapido])

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit: 20,
      order_by: 'data_vencimento',
      order_dir: 'asc',
    }

    // Filtros da barra
    if (filtros.pipeline_id) params.pipeline_id = filtros.pipeline_id
    if (filtros.etapa_id) params.etapa_id = filtros.etapa_id
    if (filtros.prioridade && filtros.prioridade.length > 0) params.prioridade = filtros.prioridade
    if (filtros.owner_id) params.owner_id = filtros.owner_id
    if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
    if (filtros.data_fim) params.data_fim = filtros.data_fim
    if (buscaDebounced) params.busca = buscaDebounced

    // Filtro rápido dos cards
    if (filtroRapido === 'em_aberto') {
      params.status = ['pendente', 'em_andamento']
    } else if (filtroRapido === 'atrasadas') {
      params.atrasadas = true
    } else if (filtroRapido === 'concluidas') {
      params.status = ['concluida']
    } else if (filtros.status && filtros.status.length > 0) {
      params.status = filtros.status
    }

    return params
  }, [page, filtros, filtroRapido, buscaDebounced])

  // Métricas params (sem paginação/busca)
  const metricasParams = useMemo(() => ({
    pipeline_id: filtros.pipeline_id,
    etapa_id: filtros.etapa_id,
    owner_id: filtros.owner_id,
    data_inicio: filtros.data_inicio,
    data_fim: filtros.data_fim,
  }), [filtros])

  // Queries
  const { data: tarefasData, isLoading: tarefasLoading } = useTarefas(queryParams as any)
  const { data: metricas, isLoading: metricasLoading } = useTarefasMetricas(metricasParams)
  const concluirMutation = useConcluirTarefa()

  const hasFiltros = !!(
    filtros.pipeline_id || filtros.etapa_id ||
    (filtros.status && filtros.status.length > 0) ||
    (filtros.prioridade && filtros.prioridade.length > 0) ||
    filtros.owner_id || filtros.data_inicio || filtros.data_fim ||
    filtroRapido || buscaDebounced
  )

  // Handlers
  const handleConcluir = useCallback((tarefa: TarefaComDetalhes) => {
    setConcluirTarefa(tarefa)
  }, [])

  const handleConfirmConcluir = useCallback(async (tarefaId: string, observacao?: string) => {
    await concluirMutation.mutateAsync({ tarefaId, observacao })
    setConcluirTarefa(null)
  }, [concluirMutation])

  const handleClickOportunidade = useCallback(async (oportunidadeId: string) => {
    // Buscar funil_id e etapas para abrir o modal
    const { data: op } = await supabase
      .from('oportunidades')
      .select('funil_id')
      .eq('id', oportunidadeId)
      .maybeSingle()

    if (op?.funil_id) {
      const { data: etapas } = await supabase
        .from('etapas_funil')
        .select('id, nome, tipo, posicao, cor')
        .eq('funil_id', op.funil_id)
        .is('deletado_em', null)
        .order('posicao')

      setDetalhesOpFunilId(op.funil_id)
      setDetalhesOpEtapas(etapas || [])
      setDetalhesOpId(oportunidadeId)
    }
  }, [])

  const handleFiltroRapidoChange = useCallback((filtro: FiltroRapido) => {
    setFiltroRapido(filtro)
    // Limpar status do filtro normal quando usar filtro rápido
    if (filtro) {
      setFiltros(prev => ({ ...prev, status: undefined }))
    }
  }, [])

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Toolbar injeta via context */}
      <TarefasToolbar
        busca={busca}
        onBuscaChange={setBusca}
        filtrosVisiveis={filtrosVisiveis}
        onToggleFiltros={() => setFiltrosVisiveis(v => !v)}
        hasFiltros={hasFiltros}
      />

      {/* Métricas */}
      <TarefasMetricasCards
        metricas={metricas}
        isLoading={metricasLoading}
        filtroAtivo={filtroRapido}
        onFiltroChange={handleFiltroRapidoChange}
      />

      {/* Filtros */}
      {filtrosVisiveis && (
        <TarefasFiltros
          filtros={filtros}
          onFiltrosChange={(f) => {
            setFiltros(f)
            setFiltroRapido(null) // Limpar filtro rápido ao usar filtros manuais
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* Lista */}
      <div className="flex-1">
        <TarefasList
          tarefas={tarefasData?.data || []}
          isLoading={tarefasLoading}
          page={page}
          totalPages={tarefasData?.pagination.total_pages || 1}
          total={tarefasData?.pagination.total || 0}
          onPageChange={setPage}
          onConcluir={handleConcluir}
          onClickOportunidade={handleClickOportunidade}
          hasFiltros={hasFiltros}
        />
      </div>

      {/* Modal Concluir */}
      {concluirTarefa && (
        <ConcluirTarefaModal
          tarefa={concluirTarefa}
          loading={concluirMutation.isPending}
          onClose={() => setConcluirTarefa(null)}
          onConfirm={handleConfirmConcluir}
        />
      )}

      {/* Modal Detalhes Oportunidade */}
      {detalhesOpId && detalhesOpFunilId && (
        <DetalhesOportunidadeModal
          oportunidadeId={detalhesOpId}
          funilId={detalhesOpFunilId}
          etapas={detalhesOpEtapas}
          onClose={() => {
            setDetalhesOpId(null)
            setDetalhesOpFunilId(null)
            setDetalhesOpEtapas([])
          }}
          onDropGanhoPerda={() => {}}
        />
      )}
    </div>
  )
}
