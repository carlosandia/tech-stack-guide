/**
 * AIDEV-NOTE: Hooks para Pré-Oportunidades (RF-11) + Preferências Métricas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preOportunidadesApi } from '../services/pre-oportunidades.api'

export function usePreOportunidadesPendentes(funilId: string | null) {
  return useQuery({
    queryKey: ['pre-oportunidades', funilId],
    queryFn: () => preOportunidadesApi.listarPendentes(funilId!),
    enabled: !!funilId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function usePreOportunidadesContagem(funilId: string | null) {
  return useQuery({
    queryKey: ['pre-oportunidades-contagem', funilId],
    queryFn: () => preOportunidadesApi.contarPendentes(funilId!),
    enabled: !!funilId,
    staleTime: 30 * 1000,
  })
}

export function useAceitarPreOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ preOpId, payload }: {
      preOpId: string
      payload: Parameters<typeof preOportunidadesApi.aceitar>[1]
    }) => preOportunidadesApi.aceitar(preOpId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-oportunidades'] })
      queryClient.invalidateQueries({ queryKey: ['pre-oportunidades-contagem'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useRejeitarPreOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ preOpId, motivo, bloquear, phoneNumber, phoneName }: {
      preOpId: string
      motivo?: string
      bloquear?: boolean
      phoneNumber?: string
      phoneName?: string
    }) => preOportunidadesApi.rejeitar(preOpId, { motivo, bloquear, phoneNumber, phoneName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-oportunidades'] })
      queryClient.invalidateQueries({ queryKey: ['pre-oportunidades-contagem'] })
      queryClient.invalidateQueries({ queryKey: ['bloqueados-pre-op'] })
    },
  })
}

// Contatos Bloqueados

export function useBloqueadosPreOp() {
  return useQuery({
    queryKey: ['bloqueados-pre-op'],
    queryFn: () => preOportunidadesApi.listarBloqueados(),
    staleTime: 60 * 1000,
  })
}

export function useDesbloquearPreOp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => preOportunidadesApi.desbloquearContato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueados-pre-op'] })
    },
  })
}

// Preferências de Métricas

export function usePreferenciasMetricas(funilId: string | null) {
  return useQuery({
    queryKey: ['preferencias-metricas', funilId],
    queryFn: () => preOportunidadesApi.buscarPreferenciasMetricas(funilId!),
    enabled: !!funilId,
    staleTime: 60 * 1000,
  })
}

export function useSalvarPreferenciasMetricas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ funilId, metricas }: { funilId: string; metricas: string[] }) =>
      preOportunidadesApi.salvarPreferenciasMetricas(funilId, metricas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias-metricas'] })
    },
  })
}
