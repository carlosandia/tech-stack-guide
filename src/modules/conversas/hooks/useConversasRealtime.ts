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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizacaoId, conversaAtivaId, queryClient])
}
