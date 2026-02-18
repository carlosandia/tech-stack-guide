/**
 * AIDEV-NOTE: React Query hooks para Tarefas (PRD-10)
 * Conforme PRD-10 - Módulo de Tarefas (Acompanhamento)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tarefasApi, type ListarTarefasParams } from '../services/tarefas.api'

export function useTarefas(params?: ListarTarefasParams) {
  return useQuery({
    queryKey: ['tarefas-lista', params],
    queryFn: () => tarefasApi.listar(params),
    staleTime: 30_000,
  })
}

export function useTarefasMetricas(params?: {
  pipeline_id?: string
  etapa_id?: string
  owner_id?: string
  data_inicio?: string
  data_fim?: string
}) {
  return useQuery({
    queryKey: ['tarefas-metricas', params],
    queryFn: () => tarefasApi.obterMetricas(params),
    staleTime: 30_000,
  })
}

export function useConcluirTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tarefaId, observacao }: { tarefaId: string; observacao?: string }) =>
      tarefasApi.concluir(tarefaId, observacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-lista'] })
      queryClient.invalidateQueries({ queryKey: ['tarefas-metricas'] })
      toast.success('Tarefa concluída com sucesso!')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao concluir tarefa')
    },
  })
}

export function useMembrosEquipe() {
  return useQuery({
    queryKey: ['tarefas-membros'],
    queryFn: () => tarefasApi.listarMembros(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFunisFiltro() {
  return useQuery({
    queryKey: ['tarefas-funis'],
    queryFn: () => tarefasApi.listarFunis(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEtapasFiltro(funilId: string | undefined) {
  return useQuery({
    queryKey: ['tarefas-etapas', funilId],
    queryFn: () => tarefasApi.listarEtapas(funilId!),
    enabled: !!funilId,
    staleTime: 2 * 60 * 1000,
  })
}
