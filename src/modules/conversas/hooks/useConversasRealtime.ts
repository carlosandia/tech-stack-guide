/**
 * AIDEV-NOTE: Hook Supabase Realtime para Conversas (PRD-09)
 * Escuta INSERT em mensagens e UPDATE em conversas para atualização em tempo real
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

export function useConversasRealtime(conversaAtivaId?: string | null) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const organizacaoId = user?.organizacao_id

  useEffect(() => {
    if (!organizacaoId) return

    const channel = supabase
      .channel(`conversas-realtime-${organizacaoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        (payload) => {
          const novaMensagem = payload.new as any

          // Invalida mensagens da conversa específica
          queryClient.invalidateQueries({ queryKey: ['mensagens', novaMensagem.conversa_id] })

          // Invalida lista de conversas para atualizar preview/contadores
          queryClient.invalidateQueries({ queryKey: ['conversas'] })

          // Se é a conversa ativa, invalida detalhes
          if (conversaAtivaId && novaMensagem.conversa_id === conversaAtivaId) {
            queryClient.invalidateQueries({ queryKey: ['conversa', conversaAtivaId] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversas',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversas'] })
          if (conversaAtivaId) {
            queryClient.invalidateQueries({ queryKey: ['conversa', conversaAtivaId] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        (payload) => {
          const mensagemAtualizada = payload.new as any
          // Invalida cache das mensagens para refletir ACK atualizado
          queryClient.invalidateQueries({ queryKey: ['mensagens', mensagemAtualizada.conversa_id] })
        }
      )
      // AIDEV-NOTE: Escuta INSERT/DELETE em conversas_labels para atualizar etiquetas em tempo real
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversas_labels',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        (payload) => {
          const novaLabel = payload.new as any
          queryClient.invalidateQueries({ queryKey: ['labels-conversa', novaLabel.conversa_id] })
          queryClient.invalidateQueries({ queryKey: ['conversas'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversas_labels',
        },
        (payload) => {
          // AIDEV-NOTE: DELETE com REPLICA IDENTITY FULL envia old row
          const old = payload.old as any
          if (old?.conversa_id) {
            queryClient.invalidateQueries({ queryKey: ['labels-conversa', old.conversa_id] })
          } else {
            queryClient.invalidateQueries({ queryKey: ['labels-conversa'] })
          }
          queryClient.invalidateQueries({ queryKey: ['conversas'] })
        }
      )
      // AIDEV-NOTE: Escuta INSERT/UPDATE em whatsapp_labels para atualizar cache de labels
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_labels',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-labels'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizacaoId, conversaAtivaId, queryClient])
}
