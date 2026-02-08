/**
 * AIDEV-NOTE: Hooks React Query para Notificacoes (PRD-15)
 * GAP 7: Supabase Realtime para atualizacao instantanea do badge
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { notificacoesApi } from '../services/notificacoes.api'

/**
 * Listar notificacoes do usuario logado
 */
export function useNotificacoes(limit = 5) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notificacoes', user?.id, limit],
    queryFn: () => notificacoesApi.listar(user!.id, limit),
    enabled: !!user?.id,
  })
}

/**
 * Contar notificacoes nao lidas (com Realtime + fallback polling 30s)
 */
export function useContagemNaoLidas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Supabase Realtime subscription (GAP 7)
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notificacoes-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return useQuery({
    queryKey: ['notificacoes', 'contagem', user?.id],
    queryFn: () => notificacoesApi.contarNaoLidas(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000, // fallback polling
  })
}

/**
 * Marcar uma notificacao como lida
 */
export function useMarcarLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificacaoId: string) => notificacoesApi.marcarComoLida(notificacaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}

/**
 * Marcar todas as notificacoes como lidas
 */
export function useMarcarTodasLidas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return notificacoesApi.marcarTodasComoLidas(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })
}
