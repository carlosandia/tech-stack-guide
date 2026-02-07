/**
 * AIDEV-NOTE: Hook para dados de detalhes da oportunidade
 * Conforme PRD-07 RF-14 - Modal de Detalhes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negociosApi } from '../services/negocios.api'

export function useOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['oportunidade', oportunidadeId],
    queryFn: () => negociosApi.buscarOportunidade(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useExcluirOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (oportunidadeId: string) => negociosApi.excluirOportunidade(oportunidadeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      queryClient.invalidateQueries({ queryKey: ['oportunidade'] })
    },
  })
}

export function useAtualizarOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: {
      id: string
      payload: {
        valor?: number | null
        usuario_responsavel_id?: string | null
        previsao_fechamento?: string | null
        observacoes?: string | null
        recorrente?: boolean | null
        periodo_recorrencia?: string | null
      }
    }) => negociosApi.atualizarOportunidade(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['oportunidade', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useAtualizarContato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      negociosApi.atualizarContato(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useAnotacoes(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['anotacoes', oportunidadeId],
    queryFn: () => negociosApi.listarAnotacoes(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 10 * 1000,
  })
}

export function useCriarAnotacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ oportunidadeId, conteudo }: { oportunidadeId: string; conteudo: string }) =>
      negociosApi.criarAnotacaoTexto(oportunidadeId, conteudo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['anotacoes', variables.oportunidadeId] })
    },
  })
}

export function useAtualizarAnotacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ anotacaoId, conteudo }: { anotacaoId: string; conteudo: string }) =>
      negociosApi.atualizarAnotacao(anotacaoId, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anotacoes'] })
    },
  })
}

export function useExcluirAnotacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (anotacaoId: string) => negociosApi.excluirAnotacao(anotacaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anotacoes'] })
    },
  })
}

export function useHistorico(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['historico', oportunidadeId],
    queryFn: () => negociosApi.listarHistorico(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook para avaliar qualificação MQL de uma oportunidade.
 * Avalia as regras vinculadas ao funil e atualiza qualificado_mql.
 */
export function useAvaliarQualificacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (oportunidadeId: string) => negociosApi.avaliarQualificacaoMQL(oportunidadeId),
    onSuccess: (_data, oportunidadeId) => {
      queryClient.invalidateQueries({ queryKey: ['oportunidade', oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}
