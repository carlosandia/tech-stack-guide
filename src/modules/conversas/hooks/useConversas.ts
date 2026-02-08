/**
 * AIDEV-NOTE: Hooks TanStack Query para Conversas (PRD-09)
 * Usa Supabase direto via conversas.api.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi, type ListarConversasParams } from '../services/conversas.api'
import { toast } from 'sonner'

export function useConversas(params?: ListarConversasParams) {
  return useQuery({
    queryKey: ['conversas', params],
    queryFn: () => conversasApi.listar(params),
    refetchInterval: 30000,
  })
}

export function useConversa(id: string | null) {
  return useQuery({
    queryKey: ['conversa', id],
    queryFn: () => conversasApi.buscarPorId(id!),
    enabled: !!id,
  })
}

export function useCriarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: conversasApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Conversa iniciada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao iniciar conversa')
    },
  })
}

export function useAlterarStatusConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'aberta' | 'pendente' | 'fechada' }) =>
      conversasApi.alterarStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversa', variables.id] })
      toast.success('Status alterado')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao alterar status')
    },
  })
}

export function useMarcarComoLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => conversasApi.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
  })
}
