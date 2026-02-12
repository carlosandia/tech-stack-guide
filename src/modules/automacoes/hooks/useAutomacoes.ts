/**
 * AIDEV-NOTE: React Query hooks para Automações (PRD-12)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '../services/automacoes.api'
import type { CriarAutomacaoInput, Acao, Condicao } from '../schemas/automacoes.schema'

const QUERY_KEY = ['automacoes']

export function useAutomacoes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.listarAutomacoes,
  })
}

export function useAutomacao(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => api.obterAutomacao(id!),
    enabled: !!id,
  })
}

export function useCriarAutomacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CriarAutomacaoInput) => api.criarAutomacao(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Automação criada com sucesso')
    },
    onError: () => toast.error('Erro ao criar automação'),
  })
}

export function useAtualizarAutomacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: {
      id: string
      payload: Partial<{
        nome: string
        descricao: string | null
        ativo: boolean
        trigger_tipo: string
        trigger_config: Record<string, unknown>
        condicoes: Condicao[]
        acoes: Acao[]
      }>
      silent?: boolean
    }) => api.atualizarAutomacao(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      if (!variables.silent) {
        toast.success('Automação atualizada')
      }
    },
    onError: () => toast.error('Erro ao atualizar automação'),
  })
}

export function useExcluirAutomacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.excluirAutomacao(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Automação excluída')
    },
    onError: () => toast.error('Erro ao excluir automação'),
  })
}

export function useToggleAutomacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      api.atualizarAutomacao(id, { ativo }),
    onSuccess: (_, { ativo }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(ativo ? 'Automação ativada' : 'Automação desativada')
    },
    onError: () => toast.error('Erro ao alterar status'),
  })
}

export function useLogsAutomacao(automacaoId?: string) {
  return useQuery({
    queryKey: ['log_automacoes', automacaoId],
    queryFn: () => api.listarLogs(automacaoId),
    enabled: !!automacaoId,
  })
}
