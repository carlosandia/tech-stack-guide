/**
 * AIDEV-NOTE: Hooks TanStack Query para Mensagens (PRD-09)
 */

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { conversasApi } from '../services/conversas.api'
import { toast } from 'sonner'

export function useMensagens(conversaId: string | null) {
  return useInfiniteQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: ({ pageParam = 1 }) =>
      conversasApi.listarMensagens(conversaId!, { page: pageParam, limit: 50, order_dir: 'desc' }),
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !!conversaId,
    refetchInterval: false,
  })
}

export function useEnviarTexto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, texto, replyTo }: { conversaId: string; texto: string; replyTo?: string }) =>
      conversasApi.enviarTexto(conversaId, texto, replyTo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Erro ao enviar mensagem')
    },
  })
}

export function useEnviarMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, dados }: { conversaId: string; dados: { tipo: string; media_url: string; caption?: string; filename?: string } }) =>
      conversasApi.enviarMedia(conversaId, dados),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Erro ao enviar mídia')
    },
  })
}
