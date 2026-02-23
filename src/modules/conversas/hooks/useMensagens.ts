/**
 * AIDEV-NOTE: Hooks TanStack Query para Mensagens (PRD-09)
 * Usa Supabase direto via conversas.api.ts
 */

import { useEffect } from 'react'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { conversasApi } from '../services/conversas.api'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const SESSION_ERROR_MSG = 'WhatsApp desconectado. Reconecte em Configurações > Conexões.'

function handleWahaError(error: Error, fallback: string) {
  if (error.message === 'SESSION_NOT_FOUND') {
    toast.error(SESSION_ERROR_MSG, { duration: 6000 })
  } else {
    toast.error(error.message || fallback)
  }
}

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
    // AIDEV-NOTE: Optimistic Update - mensagem aparece instantaneamente na UI
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['mensagens', variables.conversaId] })
      const snapshot = queryClient.getQueryData(['mensagens', variables.conversaId])

      const optimisticMsg = {
        id: `temp_${Date.now()}`,
        conversa_id: variables.conversaId,
        organizacao_id: '',
        message_id: null,
        from_me: true,
        from_number: null,
        to_number: null,
        participant: null,
        tipo: 'text' as const,
        body: variables.texto,
        media_url: null,
        media_mimetype: null,
        media_filename: null,
        media_caption: null,
        ack: 0,
        reply_to_message_id: variables.replyTo || null,
        reaction_emoji: null,
        reaction_message_id: null,
        raw_data: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        deletado_em: null,
      }

      queryClient.setQueryData(['mensagens', variables.conversaId], (old: any) => {
        if (!old?.pages?.length) return old
        const newPages = [...old.pages]
        newPages[0] = {
          ...newPages[0],
          mensagens: [optimisticMsg, ...(newPages[0].mensagens || [])],
        }
        return { ...old, pages: newPages }
      })

      return { snapshot }
    },
    onError: (error: Error, variables, context) => {
      // Rollback ao snapshot anterior
      if (context?.snapshot) {
        queryClient.setQueryData(['mensagens', variables.conversaId], context.snapshot)
      }
      handleWahaError(error, 'Erro ao enviar mensagem')
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
  })
}

export function useEnviarMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, dados }: { conversaId: string; dados: { tipo: string; media_url: string; caption?: string; filename?: string; mimetype?: string }; localPreview?: string }) =>
      conversasApi.enviarMedia(conversaId, dados),
    // AIDEV-NOTE: Optimistic Update - mídia aparece instantaneamente na UI com indicador "enviando"
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['mensagens', variables.conversaId] })
      const snapshot = queryClient.getQueryData(['mensagens', variables.conversaId])

      const optimisticMsg = {
        id: `temp_${Date.now()}`,
        conversa_id: variables.conversaId,
        organizacao_id: '',
        message_id: null,
        from_me: true,
        from_number: null,
        to_number: null,
        participant: null,
        tipo: variables.dados.tipo as string,
        body: variables.dados.caption || null,
        media_url: variables.localPreview || variables.dados.media_url,
        media_mimetype: variables.dados.mimetype || null,
        media_filename: variables.dados.filename || null,
        media_caption: variables.dados.caption || null,
        ack: 0,
        reply_to_message_id: null,
        reaction_emoji: null,
        reaction_message_id: null,
        raw_data: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        deletado_em: null,
      }

      queryClient.setQueryData(['mensagens', variables.conversaId], (old: any) => {
        if (!old?.pages?.length) return old
        const newPages = [...old.pages]
        newPages[0] = {
          ...newPages[0],
          mensagens: [optimisticMsg, ...(newPages[0].mensagens || [])],
        }
        return { ...old, pages: newPages }
      })

      return { snapshot }
    },
    onError: (error: Error, variables, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['mensagens', variables.conversaId], context.snapshot)
      }
      handleWahaError(error, 'Erro ao enviar mídia')
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
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
      handleWahaError(error, 'Erro ao enviar contato')
    },
  })
}

// AIDEV-NOTE: Realtime subscription para ACK — atualiza ticks (1→2→azuis) sem refresh
// Webhook do WAHA atualiza campo `ack` no banco; esse hook sincroniza o cache local
export function useAckRealtime(conversaId: string | null) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!conversaId) return
    const channel = supabase
      .channel(`mensagens-ack-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; ack: number; ack_name?: string }
          queryClient.setQueryData(['mensagens', conversaId], (old: any) => {
            if (!old?.pages) return old
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                mensagens: page.mensagens.map((m: any) =>
                  m.id === updated.id
                    ? { ...m, ack: updated.ack, ack_name: updated.ack_name ?? m.ack_name }
                    : m
                ),
              })),
            }
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversaId, queryClient])
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
      handleWahaError(error, 'Erro ao enviar enquete')
    },
  })
}
