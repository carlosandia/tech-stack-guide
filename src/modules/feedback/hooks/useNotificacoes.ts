/**
 * AIDEV-NOTE: Hooks React Query para Notificacoes (PRD-15)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
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
 * Contar notificacoes nao lidas (com refetch a cada 30s)
 */
export function useContagemNaoLidas() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notificacoes', 'contagem', user?.id],
    queryFn: () => notificacoesApi.contarNaoLidas(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
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
