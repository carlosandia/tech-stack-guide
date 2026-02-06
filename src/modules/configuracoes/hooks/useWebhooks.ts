/**
 * AIDEV-NOTE: React Query hooks para Webhooks de Entrada e Saída
 * Conforme PRD-05 - Webhooks Bidirecionais
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { webhooksApi } from '../services/configuracoes.api'

// =====================================================
// Webhooks de Entrada
// =====================================================

/** Busca ou cria automaticamente o webhook de entrada da organização */
export function useWebhookEntrada() {
  return useQuery({
    queryKey: ['configuracoes', 'webhooks', 'entrada', 'principal'],
    queryFn: () => webhooksApi.obterOuCriarEntrada(),
  })
}

export function useWebhooksEntrada() {
  return useQuery({
    queryKey: ['configuracoes', 'webhooks', 'entrada'],
    queryFn: () => webhooksApi.listarEntrada(),
  })
}

export function useCriarWebhookEntrada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => webhooksApi.criarEntrada(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
      toast.success('Webhook de entrada criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar webhook de entrada')
    },
  })
}

export function useAtualizarWebhookEntrada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      webhooksApi.atualizarEntrada(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
      toast.success('Webhook atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar webhook')
    },
  })
}

export function useExcluirWebhookEntrada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.excluirEntrada(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
      toast.success('Webhook de entrada excluído com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir webhook de entrada')
    },
  })
}

export function useRegenerarTokenWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.regenerarToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
      toast.success('Token regenerado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao regenerar token')
    },
  })
}

export function useRegenerarChavesWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.regenerarChaves(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
      toast.success('Chaves regeneradas com sucesso')
    },
    onError: () => {
      toast.error('Erro ao regenerar chaves')
    },
  })
}

// =====================================================
// Webhooks de Saída
// =====================================================

export function useWebhooksSaida() {
  return useQuery({
    queryKey: ['configuracoes', 'webhooks', 'saida'],
    queryFn: () => webhooksApi.listarSaida(),
  })
}

export function useCriarWebhookSaida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => webhooksApi.criarSaida(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'saida'] })
      toast.success('Webhook de saída criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar webhook de saída')
    },
  })
}

export function useAtualizarWebhookSaida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      webhooksApi.atualizarSaida(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'saida'] })
      toast.success('Webhook de saída atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar webhook de saída')
    },
  })
}

export function useExcluirWebhookSaida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.excluirSaida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'saida'] })
      toast.success('Webhook de saída excluído com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir webhook de saída')
    },
  })
}

export function useTestarWebhookSaida() {
  return useMutation({
    mutationFn: (id: string) => webhooksApi.testarSaida(id),
    onSuccess: () => {
      toast.success('Teste enviado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao testar webhook')
    },
  })
}

export function useLogsWebhookSaida(webhookId: string, params?: { evento?: string; sucesso?: string; page?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'webhooks', 'saida', webhookId, 'logs', params],
    queryFn: () => webhooksApi.listarLogsSaida(webhookId, params),
    enabled: !!webhookId,
  })
}
