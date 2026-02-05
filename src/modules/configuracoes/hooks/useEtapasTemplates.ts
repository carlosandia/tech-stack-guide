/**
 * AIDEV-NOTE: React Query hooks para Templates de Etapas
 * Conforme PRD-05 - Templates de Etapas com vínculo de tarefas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { etapasTemplatesApi } from '../services/configuracoes.api'

export function useEtapasTemplates(params?: { tipo?: string; ativo?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'etapas-templates', params],
    queryFn: () => etapasTemplatesApi.listar(params),
  })
}

export function useCriarEtapaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => etapasTemplatesApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'etapas-templates'] })
    },
  })
}

export function useAtualizarEtapaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      etapasTemplatesApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'etapas-templates'] })
    },
  })
}

export function useExcluirEtapaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => etapasTemplatesApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'etapas-templates'] })
    },
  })
}

export function useVincularTarefaEtapa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ etapaId, payload }: { etapaId: string; payload: Record<string, unknown> }) =>
      etapasTemplatesApi.vincularTarefa(etapaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'etapas-templates'] })
    },
  })
}

export function useDesvincularTarefaEtapa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ etapaId, tarefaId }: { etapaId: string; tarefaId: string }) =>
      etapasTemplatesApi.desvincularTarefa(etapaId, tarefaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'etapas-templates'] })
    },
  })
}
