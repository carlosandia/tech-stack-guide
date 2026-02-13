/**
 * AIDEV-NOTE: Hooks TanStack Query para Mensagens (PRD-09)
 * Usa Supabase direto via conversas.api.ts
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
    mutationFn: ({ conversaId, texto, replyTo, isTemplate }: { conversaId: string; texto: string; replyTo?: string; isTemplate?: boolean }) =>
      conversasApi.enviarTexto(conversaId, texto, replyTo, isTemplate),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mensagem')
    },
  })
}

export function useEnviarMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, dados }: { conversaId: string; dados: { tipo: string; media_url: string; caption?: string; filename?: string; mimetype?: string } }) =>
      conversasApi.enviarMedia(conversaId, dados),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar mídia')
    },
  })
}

export function useEnviarContato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, contatoNome, vcard }: { conversaId: string; contatoNome: string; vcard: string }) =>
      conversasApi.enviarContato(conversaId, { contact_name: contatoNome, vcard }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar contato')
    },
  })
}

export function useEnviarEnquete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, pergunta, opcoes, multiplas }: { conversaId: string; pergunta: string; opcoes: string[]; multiplas: boolean }) =>
      conversasApi.enviarEnquete(conversaId, { poll_name: pergunta, poll_options: opcoes, poll_allow_multiple: multiplas }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar enquete')
    },
  })
}
