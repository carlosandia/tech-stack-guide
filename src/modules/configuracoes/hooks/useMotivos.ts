/**
 * AIDEV-NOTE: React Query hooks para Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho/Perda
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
      toast.success('Motivo criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar motivo')
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
      toast.success('Motivo atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar motivo')
    },
  })
}

export function useExcluirMotivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => motivosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'motivos'] })
      toast.success('Motivo excluído com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir motivo')
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
      toast.success('Ordem atualizada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao reordenar motivos')
    },
  })
}
