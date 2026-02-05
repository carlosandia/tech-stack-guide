/**
 * AIDEV-NOTE: React Query hooks para Webhooks de Entrada e Saída
 * Conforme PRD-05 - Webhooks Bidirecionais
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webhooksApi } from '../services/configuracoes.api'

// =====================================================
// Webhooks de Entrada
// =====================================================

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
    },
  })
}

export function useExcluirWebhookEntrada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.excluirEntrada(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
    },
  })
}

export function useRegenerarTokenWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.regenerarToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'entrada'] })
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
    },
  })
}

export function useExcluirWebhookSaida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.excluirSaida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'webhooks', 'saida'] })
    },
  })
}

export function useTestarWebhookSaida() {
  return useMutation({
    mutationFn: (id: string) => webhooksApi.testarSaida(id),
  })
}

export function useLogsWebhookSaida(webhookId: string, params?: { evento?: string; sucesso?: string; page?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'webhooks', 'saida', webhookId, 'logs', params],
    queryFn: () => webhooksApi.listarLogsSaida(webhookId, params),
    enabled: !!webhookId,
  })
}
