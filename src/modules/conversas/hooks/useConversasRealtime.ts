/**
 * AIDEV-NOTE: Hook Supabase Realtime para Conversas (PRD-09)
 * Escuta INSERT em mensagens e UPDATE em conversas para atualização em tempo real
 * AIDEV-NOTE: Debounce de 2s para evitar "refetch storms" em alta atividade (Plano de Escala)
 */

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

export function useConversasRealtime(conversaAtivaId?: string | null) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const organizacaoId = user?.organizacao_id

  // AIDEV-NOTE: Debounce refs — mesmo padrão do useKanban.ts
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const debouncedInvalidate = useCallback((key: string, queryKeys: unknown[][]) => {
    const existing = debounceTimers.current.get(key)
    if (existing) clearTimeout(existing)

    debounceTimers.current.set(key, setTimeout(() => {
      queryKeys.forEach(qk => queryClient.invalidateQueries({ queryKey: qk }))
      debounceTimers.current.delete(key)
    }, 2000))
  }, [queryClient])

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
          const keys: unknown[][] = [
            ['mensagens', novaMensagem.conversa_id],
            ['conversas'],
          ]
          if (conversaAtivaId && novaMensagem.conversa_id === conversaAtivaId) {
            keys.push(['conversa', conversaAtivaId])
          }
          debouncedInvalidate(`msg-insert-${novaMensagem.conversa_id}`, keys)
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
          const keys: unknown[][] = [['conversas']]
          if (conversaAtivaId) {
            keys.push(['conversa', conversaAtivaId])
          }
          debouncedInvalidate('conversas-update', keys)
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
          debouncedInvalidate(`msg-update-${mensagemAtualizada.conversa_id}`, [
            ['mensagens', mensagemAtualizada.conversa_id],
          ])
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
          debouncedInvalidate(`label-insert-${novaLabel.conversa_id}`, [
            ['labels-conversa', novaLabel.conversa_id],
            ['conversas'],
          ])
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
          const keys: unknown[][] = [['conversas']]
          if (old?.conversa_id) {
            keys.push(['labels-conversa', old.conversa_id])
          } else {
            keys.push(['labels-conversa'])
          }
          debouncedInvalidate('label-delete', keys)
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
          debouncedInvalidate('whatsapp-labels', [['whatsapp-labels']])
        }
      )
      .subscribe()

    return () => {
      // Limpar todos os timers pendentes
      debounceTimers.current.forEach(timer => clearTimeout(timer))
      debounceTimers.current.clear()
      supabase.removeChannel(channel)
    }
  }, [organizacaoId, conversaAtivaId, queryClient, debouncedInvalidate])
}
