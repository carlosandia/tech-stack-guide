/**
 * AIDEV-NOTE: React Query hooks para Campos Personalizados
 * Conforme PRD-05 - Campos Customizados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { camposApi, type Entidade, type CriarCampoPayload, type AtualizarCampoPayload } from '../services/configuracoes.api'

export function useCampos(entidade: Entidade) {
  return useQuery({
    queryKey: ['configuracoes', 'campos', entidade],
    queryFn: () => camposApi.listar(entidade),
  })
}

export function useCriarCampo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CriarCampoPayload) => camposApi.criar(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['configuracoes', 'campos', variables.entidade],
      })
    },
  })
}

export function useAtualizarCampo(entidade: Entidade) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarCampoPayload }) =>
      camposApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['configuracoes', 'campos', entidade],
      })
    },
  })
}

export function useExcluirCampo(entidade: Entidade) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => camposApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['configuracoes', 'campos', entidade],
      })
    },
  })
}
