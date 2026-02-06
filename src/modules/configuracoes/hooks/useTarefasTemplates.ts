/**
 * AIDEV-NOTE: React Query hooks para Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tarefasTemplatesApi } from '../services/configuracoes.api'

export function useTarefasTemplates(params?: { tipo?: string; ativo?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'tarefas-templates', params],
    queryFn: () => tarefasTemplatesApi.listar(params),
  })
}

export function useCriarTarefaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => tarefasTemplatesApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'tarefas-templates'] })
      toast.success('Template de tarefa criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar template de tarefa')
    },
  })
}

export function useAtualizarTarefaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      tarefasTemplatesApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'tarefas-templates'] })
      toast.success('Template de tarefa atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar template de tarefa')
    },
  })
}

export function useExcluirTarefaTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tarefasTemplatesApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'tarefas-templates'] })
      toast.success('Template de tarefa excluído com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir template de tarefa')
    },
  })
}
