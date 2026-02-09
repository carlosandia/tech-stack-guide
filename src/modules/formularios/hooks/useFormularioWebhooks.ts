/**
 * AIDEV-NOTE: React Query hooks para Webhooks de Formulários
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formulariosApi } from '../services/formularios.api'
import { toast } from 'sonner'

export function useWebhooksFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'webhooks'],
    queryFn: () => formulariosApi.listarWebhooks(formularioId!),
    enabled: !!formularioId,
  })
}

export function useLogsWebhook(webhookId: string | null) {
  return useQuery({
    queryKey: ['webhooks', webhookId, 'logs'],
    queryFn: () => formulariosApi.listarLogsWebhook(webhookId!),
    enabled: !!webhookId,
  })
}

export function useCriarWebhook(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof formulariosApi.criarWebhook>[1]) =>
      formulariosApi.criarWebhook(formularioId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'webhooks'] })
      toast.success('Webhook criado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAtualizarWebhook(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ webhookId, payload }: { webhookId: string; payload: Partial<Parameters<typeof formulariosApi.criarWebhook>[1]> }) =>
      formulariosApi.atualizarWebhook(webhookId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'webhooks'] })
      toast.success('Webhook atualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useExcluirWebhook(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (webhookId: string) => formulariosApi.excluirWebhook(webhookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'webhooks'] })
      toast.success('Webhook excluído')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
