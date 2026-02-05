/**
 * AIDEV-NOTE: React Query hooks para Integrações OAuth
 * Conforme PRD-05 - Conexões com Plataformas Externas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { integracoesApi, type PlataformaIntegracao } from '../services/configuracoes.api'

export function useIntegracoes() {
  return useQuery({
    queryKey: ['configuracoes', 'integracoes'],
    queryFn: () => integracoesApi.listar(),
  })
}

export function useDesconectarIntegracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => integracoesApi.desconectar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
    },
  })
}

export function useSincronizarIntegracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => integracoesApi.sincronizar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
    },
  })
}

export function useObterAuthUrl() {
  return useMutation({
    mutationFn: ({ plataforma, redirect_uri }: { plataforma: PlataformaIntegracao; redirect_uri: string }) =>
      integracoesApi.obterAuthUrl(plataforma, redirect_uri),
  })
}

export function useProcessarCallback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      plataforma,
      code,
      state,
      redirect_uri,
    }: {
      plataforma: PlataformaIntegracao
      code: string
      state: string
      redirect_uri: string
    }) => integracoesApi.processarCallback(plataforma, { code, state, redirect_uri }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
    },
  })
}
