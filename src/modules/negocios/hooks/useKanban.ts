/**
 * AIDEV-NOTE: Hook para dados do Kanban com TanStack Query
 * Conforme PRD-07 - Módulo de Negócios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosApi } from '../services/negocios.api'

interface KanbanFiltros {
  busca?: string
  responsavelId?: string
}

export function useKanban(funilId: string | null, filtros?: KanbanFiltros) {
  return useQuery({
    queryKey: ['kanban', funilId, filtros],
    queryFn: () => negociosApi.carregarKanban(funilId!, filtros),
    enabled: !!funilId,
    staleTime: 30 * 1000, // 30s para dados mais frescos
    refetchOnWindowFocus: true,
  })
}

export function useMoverEtapa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ oportunidadeId, etapaDestinoId }: { oportunidadeId: string; etapaDestinoId: string }) =>
      negociosApi.moverEtapa(oportunidadeId, etapaDestinoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useCriarOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: negociosApi.criarOportunidade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
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
    },
  })
}
