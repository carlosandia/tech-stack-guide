/**
 * AIDEV-NOTE: Hook TanStack Query para Funis (Pipelines)
 * Conforme PRD-07 - Módulo de Negócios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosApi } from '../services/negocios.api'

export function useFunis() {
  return useQuery({
    queryKey: ['funis'],
    queryFn: negociosApi.listarFunis,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

export function useFunilComEtapas(funilId: string | null) {
  return useQuery({
    queryKey: ['funil', funilId],
    queryFn: () => negociosApi.buscarFunilComEtapas(funilId!),
    enabled: !!funilId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCriarFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { nome: string; descricao?: string; cor?: string }) =>
      negociosApi.criarFunil(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
    },
  })
}

export function useAtualizarFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ funilId, nome }: { funilId: string; nome: string }) =>
      negociosApi.atualizarFunil(funilId, { nome }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
      queryClient.invalidateQueries({ queryKey: ['funil', variables.funilId] })
    },
  })
}

export function useArquivarFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (funilId: string) => negociosApi.arquivarFunil(funilId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
    },
  })
}

export function useDesarquivarFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (funilId: string) => negociosApi.desarquivarFunil(funilId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
    },
  })
}

export function useExcluirFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (funilId: string) => negociosApi.excluirFunil(funilId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
    },
  })
}

// AIDEV-NOTE: Hook para migrar oportunidades para outro funil e excluir o original
export function useMigrarEExcluirFunil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ funilOrigemId, funilDestinoId }: { funilOrigemId: string; funilDestinoId: string }) =>
      negociosApi.migrarEExcluirPipeline(funilOrigemId, funilDestinoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funis'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}
