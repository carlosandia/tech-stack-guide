/**
 * AIDEV-NOTE: React Query hooks para Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho/Perda
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motivosApi, type TipoMotivo } from '../services/configuracoes.api'

export function useMotivos(tipo?: TipoMotivo) {
  return useQuery({
    queryKey: ['configuracoes', 'motivos', tipo],
    queryFn: () => motivosApi.listar(tipo),
  })
}

export function useCriarMotivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => motivosApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'motivos'] })
    },
  })
}

export function useAtualizarMotivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      motivosApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'motivos'] })
    },
  })
}

export function useExcluirMotivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => motivosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'motivos'] })
    },
  })
}

export function useReordenarMotivos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tipo, ordem }: { tipo: TipoMotivo; ordem: Array<{ id: string; ordem: number }> }) =>
      motivosApi.reordenar(tipo, ordem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'motivos'] })
    },
  })
}
