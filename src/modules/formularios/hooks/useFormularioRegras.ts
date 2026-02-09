/**
 * AIDEV-NOTE: React Query hooks para Regras Condicionais de Formulários
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formulariosApi, type RegraCondicional } from '../services/formularios.api'

export function useRegrasCondicionais(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'regras'],
    queryFn: () => formulariosApi.listarRegras(formularioId!),
    enabled: !!formularioId,
  })
}

export function useCriarRegra(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<RegraCondicional>) =>
      formulariosApi.criarRegra(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'regras'] })
      toast.success('Regra criada')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao criar regra'),
  })
}

export function useAtualizarRegra(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ regraId, payload }: { regraId: string; payload: Partial<RegraCondicional> }) =>
      formulariosApi.atualizarRegra(formularioId, regraId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'regras'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao atualizar regra'),
  })
}

export function useExcluirRegra(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (regraId: string) =>
      formulariosApi.excluirRegra(formularioId, regraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'regras'] })
      toast.success('Regra removida')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao remover regra'),
  })
}
