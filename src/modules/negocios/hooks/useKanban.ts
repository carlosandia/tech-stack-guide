/**
 * AIDEV-NOTE: Hook para dados do Kanban com TanStack Query + Supabase Realtime
 * Conforme PRD-07 - Módulo de Negócios
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosApi } from '../services/negocios.api'
import { supabase } from '@/lib/supabase'

interface KanbanFiltros {
  busca?: string
  responsavelId?: string
  qualificacao?: ('lead' | 'mql' | 'sql')[]
  valorMin?: number
  valorMax?: number
  origem?: string
  periodoInicio?: string
  periodoFim?: string
}

export function useKanban(funilId: string | null, filtros?: KanbanFiltros) {
  const queryClient = useQueryClient()

  // Supabase Realtime: invalidar kanban quando oportunidades mudam
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
          queryClient.invalidateQueries({ queryKey: ['kanban', funilId] })
        }
      )
      .subscribe()

    return () => {
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
    mutationFn: ({ oportunidadeId, etapaDestinoId }: { oportunidadeId: string; etapaDestinoId: string }) =>
      negociosApi.moverEtapa(oportunidadeId, etapaDestinoId),
    onSuccess: (_data, variables) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}
