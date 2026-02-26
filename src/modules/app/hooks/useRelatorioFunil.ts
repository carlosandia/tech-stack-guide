/**
 * AIDEV-NOTE: Hooks para o Dashboard de Relatório de Funil (PRD-18)
 * Usa TanStack Query com stale time de 5 minutos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRelatorioFunil, salvarInvestimento, removerInvestimento, fetchFunis, fetchDashboardMetricasGerais, fetchMetricasAtendimento, fetchRelatorioMetas, fetchHeatmapAtendimento } from '../services/relatorio.service'
import type { FunilQuery, SalvarInvestimentoPayload } from '../types/relatorio.types'
import { toast } from 'sonner'

const STALE_TIME = 5 * 60 * 1000 // 5 minutos

export function useRelatorioFunil(query: FunilQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['relatorio-funil', query],
    queryFn: () => fetchRelatorioFunil(query),
    staleTime: STALE_TIME,
    retry: 1,
    enabled: options?.enabled ?? true,
  })
}

export function useFunis() {
  return useQuery({
    queryKey: ['funis-lista'],
    queryFn: fetchFunis,
    staleTime: 10 * 60 * 1000,
  })
}

export function useDashboardMetricasGerais(query: FunilQuery) {
  return useQuery({
    queryKey: ['dashboard-metricas-gerais', query],
    queryFn: () => fetchDashboardMetricasGerais(query),
    staleTime: STALE_TIME,
    retry: 1,
  })
}

export function useMetricasAtendimento(query: FunilQuery, canal?: string) {
  return useQuery({
    queryKey: ['metricas-atendimento', query, canal],
    queryFn: () => fetchMetricasAtendimento(query, canal),
    staleTime: STALE_TIME,
    retry: 1,
  })
}

export function useRelatorioMetas(query: FunilQuery) {
  return useQuery({
    queryKey: ['relatorio-metas', query],
    queryFn: () => fetchRelatorioMetas(query),
    staleTime: STALE_TIME,
    retry: 1,
  })
}

export function useSalvarInvestimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalvarInvestimentoPayload) => salvarInvestimento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorio-funil'] })
      toast.success('Investimento salvo com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar investimento: ${error.message}`)
    },
  })
}

export function useRemoverInvestimento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { periodo_inicio: string; periodo_fim: string }) =>
      removerInvestimento(params.periodo_inicio, params.periodo_fim),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorio-funil'] })
      toast.success('Investimento removido com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover investimento: ${error.message}`)
    },
  })
}

export function useHeatmapAtendimento(query: FunilQuery, canal?: string, tipo?: string) {
  return useQuery({
    queryKey: ['heatmap-atendimento', query, canal, tipo],
    queryFn: () => fetchHeatmapAtendimento(query, canal, tipo),
    staleTime: STALE_TIME,
    retry: 1,
  })
}
