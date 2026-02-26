/**
 * AIDEV-NOTE: Hooks para o Dashboard de Relatório de Funil (PRD-18)
 * Usa TanStack Query com stale time de 5 minutos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRelatorioFunil, salvarInvestimento, fetchFunis } from '../services/relatorio.service'
import type { FunilQuery, SalvarInvestimentoPayload } from '../types/relatorio.types'
import { toast } from 'sonner'

const STALE_TIME = 5 * 60 * 1000 // 5 minutos

export function useRelatorioFunil(query: FunilQuery) {
  return useQuery({
    queryKey: ['relatorio-funil', query],
    queryFn: () => fetchRelatorioFunil(query),
    staleTime: STALE_TIME,
    retry: 1,
  })
}

export function useFunis() {
  return useQuery({
    queryKey: ['funis-lista'],
    queryFn: fetchFunis,
    staleTime: 10 * 60 * 1000, // 10 minutos
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
