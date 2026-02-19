/**
 * AIDEV-NOTE: Hook para dados do Kanban com TanStack Query + Supabase Realtime
 * Conforme PRD-07 - Módulo de Negócios
 */

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosApi } from '../services/negocios.api'
import { supabase } from '@/lib/supabase'

interface KanbanFiltros {
  busca?: string
  responsavelIds?: string[]
  valorMin?: number
  valorMax?: number
  periodoInicio?: string
  periodoFim?: string
  dataCriacaoInicio?: string
  dataCriacaoFim?: string
  previsaoFechamentoInicio?: string
  previsaoFechamentoFim?: string
}

export function useKanban(funilId: string | null, filtros?: KanbanFiltros) {
  const queryClient = useQueryClient()

  // AIDEV-NOTE: Debounce de 2s no Realtime para evitar refetch storms (Plano de Escala 1.1)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!funilId) return

    const channel = supabase
      .channel(`kanban_${funilId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oportunidades',
          filter: `funil_id=eq.${funilId}`,
        },
        () => {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['kanban', funilId] })
          }, 2000)
        }
      )
      .subscribe()

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [funilId, queryClient])

  return useQuery({
    queryKey: ['kanban', funilId, filtros],
    queryFn: () => negociosApi.carregarKanban(funilId!, filtros),
    enabled: !!funilId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMoverEtapa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ oportunidadeId, etapaDestinoId, dropIndex }: { oportunidadeId: string; etapaDestinoId: string; dropIndex?: number }) =>
      negociosApi.moverEtapa(oportunidadeId, etapaDestinoId, dropIndex),

    // AIDEV-NOTE: Optimistic update para drag-and-drop fluido com posição
    onMutate: async ({ oportunidadeId, etapaDestinoId, dropIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban'] })
      const previousKanbanQueries = queryClient.getQueriesData({ queryKey: ['kanban'] })

      queryClient.setQueriesData({ queryKey: ['kanban'] }, (old: any) => {
        if (!old?.etapas) return old

        let oportunidadeMovida: any = null
        const etapasAtualizadas = old.etapas.map((etapa: any) => {
          const idx = etapa.oportunidades.findIndex((op: any) => op.id === oportunidadeId)
          if (idx !== -1) {
            oportunidadeMovida = { ...etapa.oportunidades[idx], etapa_id: etapaDestinoId }
            const novasOps = [...etapa.oportunidades]
            novasOps.splice(idx, 1)
            return {
              ...etapa,
              oportunidades: novasOps,
              total_oportunidades: etapa.total_oportunidades - 1,
              valor_total: etapa.valor_total - (oportunidadeMovida.valor || 0),
            }
          }
          return etapa
        })

        if (!oportunidadeMovida) return old

        const etapasFinais = etapasAtualizadas.map((etapa: any) => {
          if (etapa.id === etapaDestinoId) {
            const novasOps = [...etapa.oportunidades]
            // AIDEV-NOTE: Inserir na posição correta (dropIndex) ao invés de append
            if (dropIndex !== undefined && dropIndex >= 0) {
              novasOps.splice(dropIndex, 0, oportunidadeMovida)
            } else {
              novasOps.push(oportunidadeMovida)
            }
            return {
              ...etapa,
              oportunidades: novasOps,
              total_oportunidades: etapa.total_oportunidades + 1,
              valor_total: etapa.valor_total + (oportunidadeMovida.valor || 0),
            }
          }
          return etapa
        })

        return { ...old, etapas: etapasFinais }
      })

      return { previousKanbanQueries }
    },

    onError: (_err, _variables, context) => {
      // Rollback: restaurar snapshot anterior
      if (context?.previousKanbanQueries) {
        for (const [queryKey, data] of context.previousKanbanQueries) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['historico', variables.oportunidadeId] })
    },
  })
}

export function useCriarOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: negociosApi.criarOportunidade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

export function useFecharOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      oportunidadeId,
      tipo,
      etapaDestinoId,
      motivoId,
      observacoes,
    }: {
      oportunidadeId: string
      tipo: 'ganho' | 'perda'
      etapaDestinoId: string
      motivoId?: string
      observacoes?: string
    }) => negociosApi.fecharOportunidade(oportunidadeId, tipo, etapaDestinoId, motivoId, observacoes),

    // AIDEV-NOTE: Optimistic update — remove card do kanban imediatamente
    onMutate: async ({ oportunidadeId, etapaDestinoId }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban'] })
      const previousKanbanQueries = queryClient.getQueriesData({ queryKey: ['kanban'] })

      queryClient.setQueriesData({ queryKey: ['kanban'] }, (old: any) => {
        if (!old?.etapas) return old

        let oportunidadeMovida: any = null
        const etapasAtualizadas = old.etapas.map((etapa: any) => {
          const idx = etapa.oportunidades.findIndex((op: any) => op.id === oportunidadeId)
          if (idx !== -1) {
            oportunidadeMovida = { ...etapa.oportunidades[idx], etapa_id: etapaDestinoId }
            const novasOps = [...etapa.oportunidades]
            novasOps.splice(idx, 1)
            return {
              ...etapa,
              oportunidades: novasOps,
              total_oportunidades: etapa.total_oportunidades - 1,
              valor_total: etapa.valor_total - (oportunidadeMovida.valor || 0),
            }
          }
          return etapa
        })

        if (!oportunidadeMovida) return old

        // Mover para etapa destino (ganho/perdido)
        const etapasFinais = etapasAtualizadas.map((etapa: any) => {
          if (etapa.id === etapaDestinoId) {
            return {
              ...etapa,
              oportunidades: [...etapa.oportunidades, oportunidadeMovida],
              total_oportunidades: etapa.total_oportunidades + 1,
              valor_total: etapa.valor_total + (oportunidadeMovida.valor || 0),
            }
          }
          return etapa
        })

        return { ...old, etapas: etapasFinais }
      })

      return { previousKanbanQueries }
    },
    onError: (_err, _vars, context) => {
      // Rollback em caso de erro
      if (context?.previousKanbanQueries) {
        context.previousKanbanQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

export function useExcluirOportunidadesEmMassa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => negociosApi.excluirOportunidadesEmMassa(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useMoverOportunidadesEmMassa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, etapaDestinoId }: { ids: string[]; etapaDestinoId: string }) =>
      negociosApi.moverOportunidadesEmMassa(ids, etapaDestinoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useMoverOportunidadesParaOutraPipeline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, funilDestinoId, etapaDestinoId }: { ids: string[]; funilDestinoId: string; etapaDestinoId: string }) =>
      negociosApi.moverOportunidadesParaOutraPipeline(ids, funilDestinoId, etapaDestinoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['funis'] })
    },
  })
}
