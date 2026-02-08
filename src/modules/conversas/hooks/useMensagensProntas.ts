/**
 * AIDEV-NOTE: Hook para Mensagens Prontas / Quick Replies (PRD-09)
 * Usa Supabase direto via conversas.api.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi } from '../services/conversas.api'
import { toast } from 'sonner'

export function useMensagensProntas(busca?: string) {
  return useQuery({
    queryKey: ['mensagens-prontas', busca],
    queryFn: () => conversasApi.listarProntas({ busca }),
  })
}

export function useCriarMensagemPronta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: conversasApi.criarPronta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-prontas'] })
      toast.success('Mensagem pronta criada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar mensagem pronta')
    },
  })
}

export function useExcluirMensagemPronta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => conversasApi.excluirPronta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-prontas'] })
      toast.success('Mensagem pronta excluída')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir')
    },
  })
}
