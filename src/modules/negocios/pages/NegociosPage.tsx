/**
 * AIDEV-NOTE: Página principal do módulo de Negócios (Kanban)
 * Conforme PRD-07 - Módulo de Negócios
 * Layout: Toolbar (via context) + MetricasPanel + KanbanBoard
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useFunis, useCriarFunil, useArquivarFunil, useDesarquivarFunil, useExcluirFunil } from '../hooks/useFunis'
import { useKanban } from '../hooks/useKanban'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { KanbanEmptyState } from '../components/kanban/KanbanEmptyState'
import { NegociosToolbar } from '../components/toolbar/NegociosToolbar'
import { MetricasPanel } from '../components/toolbar/MetricasPanel'
import { NovaPipelineModal } from '../components/modals/NovaPipelineModal'
import { NovaOportunidadeModal } from '../components/modals/NovaOportunidadeModal'
import { FecharOportunidadeModal } from '../components/modals/FecharOportunidadeModal'
import { DetalhesOportunidadeModal } from '../components/detalhes/DetalhesOportunidadeModal'
import { arrayToMetricasVisiveis, type MetricasVisiveis } from '../components/toolbar/FiltrarMetricasPopover'
import { usePreferenciasMetricas } from '../hooks/usePreOportunidades'
import type { Funil, Oportunidade } from '../services/negocios.api'
import { negociosApi } from '../services/negocios.api'
import type { FiltrosKanban } from '../components/toolbar/FiltrosPopover'
import type { PeriodoFiltro } from '../components/toolbar/PeriodoSelector'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const STORAGE_KEY = 'negocios_funil_ativo'
const METRICAS_KEY = 'negocios_metricas_visivel'

export default function NegociosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State
  const [funilAtivoId, setFunilAtivoId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState<FiltrosKanban>({})
  const [periodo, setPeriodo] = useState<PeriodoFiltro>({ preset: 'todos' })
  const [metricasVisivel, setMetricasVisivel] = useState(() => {
    return localStorage.getItem(METRICAS_KEY) !== 'false'
  })
  const [metricasVisiveis, setMetricasVisiveis] = useState<MetricasVisiveis>({})

  // Carregar preferências de métricas do banco
  const { data: prefMetricas } = usePreferenciasMetricas(funilAtivoId)
  useEffect(() => {
    if (prefMetricas) {
      setMetricasVisiveis(arrayToMetricasVisiveis(prefMetricas))
    }
  }, [prefMetricas])
  const [showNovaPipeline, setShowNovaPipeline] = useState(false)
  const [showNovaOportunidade, setShowNovaOportunidade] = useState(false)
  const [fecharOp, setFecharOp] = useState<{
    oportunidade: Oportunidade
    etapaId: string
    tipo: 'ganho' | 'perda'
  } | null>(null)
  const [detalhesOpId, setDetalhesOpId] = useState<string | null>(null)

  // Queries
  const { data: funis, isLoading: funisLoading } = useFunis()
  const criarFunil = useCriarFunil()
  const arquivarFunil = useArquivarFunil()
  const desarquivarFunil = useDesarquivarFunil()
  const excluirFunil = useExcluirFunil()

  // Auto-selecionar primeiro funil
  useEffect(() => {
    if (funis && funis.length > 0 && !funilAtivoId) {
      const ativas = funis.filter(f => f.ativo !== false && !f.arquivado)
      if (ativas.length > 0) {
        setFunilAtivoId(ativas[0].id)
        localStorage.setItem(STORAGE_KEY, ativas[0].id)
      }
    }
  }, [funis, funilAtivoId])

  // Memoize kanban filters
  const kanbanFiltros = useMemo(() => ({
    busca: busca.length >= 3 ? busca : undefined,
    responsavelId: filtros.responsavelId,
    qualificacao: filtros.qualificacao,
    valorMin: filtros.valorMin,
    valorMax: filtros.valorMax,
    origem: filtros.origem,
    periodoInicio: periodo.inicio,
    periodoFim: periodo.fim,
  }), [busca, filtros, periodo])

  // Kanban data
  const { data: kanbanData, isLoading: kanbanLoading } = useKanban(funilAtivoId, kanbanFiltros)

  const funilAtivo = funis?.find(f => f.id === funilAtivoId) || null

  // Encontrar a etapa de entrada
  const etapaEntradaId = kanbanData?.etapas?.find(e => e.tipo === 'entrada')?.id
    || kanbanData?.etapas?.[0]?.id
    || ''

  const handleSelectFunil = useCallback((funil: Funil) => {
    setFunilAtivoId(funil.id)
    localStorage.setItem(STORAGE_KEY, funil.id)
    setBusca('')
    setMetricasVisiveis({})
  }, [])

  const handleCriarPipeline = useCallback(async (data: { nome: string; descricao?: string; cor?: string; membrosIds?: string[] }) => {
    try {
      const { membrosIds, ...funilData } = data
      const novoFunil = await criarFunil.mutateAsync(funilData)

      if (membrosIds && membrosIds.length > 0) {
        try {
          await negociosApi.adicionarMembrosFunil(novoFunil.id, membrosIds)
        } catch (err) {
          console.error('Erro ao adicionar membros:', err)
        }
      }

      setFunilAtivoId(novoFunil.id)
      localStorage.setItem(STORAGE_KEY, novoFunil.id)
      setShowNovaPipeline(false)
      toast.success('Pipeline criado com sucesso!')
      navigate(`/app/negocios/pipeline/${novoFunil.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar pipeline')
    }
  }, [criarFunil, navigate])

  const handleArquivar = useCallback(async (funilId: string) => {
    try {
      await arquivarFunil.mutateAsync(funilId)
      if (funilId === funilAtivoId) {
        const ativas = (funis || []).filter(f => f.id !== funilId && f.ativo !== false && !f.arquivado)
        if (ativas.length > 0) {
          setFunilAtivoId(ativas[0].id)
          localStorage.setItem(STORAGE_KEY, ativas[0].id)
        } else {
          setFunilAtivoId(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      toast.success('Pipeline arquivada')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao arquivar')
    }
  }, [arquivarFunil, funilAtivoId, funis])

  const handleDesarquivar = useCallback(async (funilId: string) => {
    try {
      await desarquivarFunil.mutateAsync(funilId)
      toast.success('Pipeline desarquivada')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desarquivar')
    }
  }, [desarquivarFunil])

  const handleExcluir = useCallback(async (funilId: string) => {
    try {
      await excluirFunil.mutateAsync(funilId)
      if (funilId === funilAtivoId) {
        const restantes = (funis || []).filter(f => f.id !== funilId && !f.deletado_em)
        if (restantes.length > 0) {
          setFunilAtivoId(restantes[0].id)
          localStorage.setItem(STORAGE_KEY, restantes[0].id)
        } else {
          setFunilAtivoId(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      toast.success('Pipeline excluída')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }, [excluirFunil, funilAtivoId, funis])

  const handleDropGanhoPerda = useCallback((oportunidade: Oportunidade, etapaId: string, tipo: 'ganho' | 'perda') => {
    setFecharOp({ oportunidade, etapaId, tipo })
  }, [])

  const handleCardClick = useCallback((oportunidade: Oportunidade) => {
    setDetalhesOpId(oportunidade.id)
  }, [])

  const handleNovaOportunidade = useCallback(() => {
    if (!funilAtivoId || !etapaEntradaId) {
      toast.error('Selecione uma pipeline primeiro')
      return
    }
    setShowNovaOportunidade(true)
  }, [funilAtivoId, etapaEntradaId])

  const handleToggleMetricas = useCallback(() => {
    setMetricasVisivel(prev => {
      const next = !prev
      localStorage.setItem(METRICAS_KEY, String(next))
      return next
    })
  }, [])

  // Loading state
  if (funisLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const funisAtivas = (funis || []).filter(f => f.ativo !== false && !f.arquivado)
  const semPipelines = funisAtivas.length === 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar injeta via context */}
      <NegociosToolbar
        funis={funis || []}
        funilAtivo={funilAtivo}
        onSelectFunil={handleSelectFunil}
        onNovaPipeline={() => setShowNovaPipeline(true)}
        onNovaOportunidade={handleNovaOportunidade}
        onArquivar={handleArquivar}
        onDesarquivar={handleDesarquivar}
        onExcluir={handleExcluir}
        busca={busca}
        onBuscaChange={setBusca}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        isAdmin={isAdmin}
      />

      {/* Métricas */}
      {kanbanData && !semPipelines && (
        <MetricasPanel
          data={kanbanData}
          visivel={metricasVisivel}
          onToggle={handleToggleMetricas}
          funilId={funilAtivoId}
          metricasVisiveis={metricasVisiveis}
          onMetricasVisiveisChange={setMetricasVisiveis}
        />
      )}

      {/* Content */}
      {semPipelines ? (
        <KanbanEmptyState onCriarPipeline={() => setShowNovaPipeline(true)} />
      ) : kanbanData ? (
        <KanbanBoard
          data={kanbanData}
          isLoading={kanbanLoading}
          onDropGanhoPerda={handleDropGanhoPerda}
          onCardClick={handleCardClick}
        />
      ) : kanbanLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {/* Modals */}
      {showNovaPipeline && (
        <NovaPipelineModal
          onClose={() => setShowNovaPipeline(false)}
          onSubmit={handleCriarPipeline}
          loading={criarFunil.isPending}
        />
      )}

      {showNovaOportunidade && funilAtivoId && etapaEntradaId && (
        <NovaOportunidadeModal
          funilId={funilAtivoId}
          etapaEntradaId={etapaEntradaId}
          onClose={() => setShowNovaOportunidade(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
            toast.success('Oportunidade criada com sucesso!')
          }}
        />
      )}

      {fecharOp && funilAtivoId && (
        <FecharOportunidadeModal
          oportunidade={fecharOp.oportunidade}
          etapaDestinoId={fecharOp.etapaId}
          tipo={fecharOp.tipo}
          funilId={funilAtivoId}
          onClose={() => setFecharOp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban'] })
            toast.success(fecharOp.tipo === 'ganho' ? 'Oportunidade ganha! 🎉' : 'Oportunidade marcada como perdida')
            setFecharOp(null)
          }}
        />
      )}

      {detalhesOpId && funilAtivoId && kanbanData && (
        <DetalhesOportunidadeModal
          oportunidadeId={detalhesOpId}
          funilId={funilAtivoId}
          etapas={kanbanData.etapas}
          onClose={() => setDetalhesOpId(null)}
          onDropGanhoPerda={(op, etapaId, tipo) => {
            setDetalhesOpId(null)
            handleDropGanhoPerda(op, etapaId, tipo)
          }}
        />
      )}
    </div>
  )
}
