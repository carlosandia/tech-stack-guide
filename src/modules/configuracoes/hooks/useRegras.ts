/**
 * AIDEV-NOTE: React Query hooks para Regras de Qualificação e Config Cards
 * Conforme PRD-05 - Regras MQL e Personalização de Cards
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { regrasApi, configCardApi } from '../services/configuracoes.api'

// =====================================================
// Regras de Qualificação
// =====================================================

export function useRegras(params?: { ativa?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'regras', params],
    queryFn: () => regrasApi.listar(params),
  })
}

export function useCriarRegra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => regrasApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'regras'] })
    },
  })
}

export function useAtualizarRegra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      regrasApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'regras'] })
    },
  })
}

export function useExcluirRegra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => regrasApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'regras'] })
    },
  })
}

// =====================================================
// Configuração de Cards
// =====================================================

export function useConfigCard() {
  return useQuery({
    queryKey: ['configuracoes', 'config-card'],
    queryFn: () => configCardApi.buscar(),
  })
}

export function useAtualizarConfigCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => configCardApi.atualizar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'config-card'] })
    },
  })
}
