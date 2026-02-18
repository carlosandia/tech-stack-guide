/**
 * AIDEV-NOTE: Hooks TanStack Query para Conversas (PRD-09)
 * useConversas usa useInfiniteQuery para scroll infinito (20 por vez)
 * Inclui hooks para ações sincronizadas com WhatsApp
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi, type ListarConversasParams } from '../services/conversas.api'
import { toast } from 'sonner'

export function useConversas(params?: ListarConversasParams) {
  return useInfiniteQuery({
    queryKey: ['conversas', params],
    queryFn: ({ pageParam }) => conversasApi.listar({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    // AIDEV-NOTE: refetchInterval removido — Realtime (useConversasRealtime) já invalida o cache
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

// =====================================================
// Hooks para ações sincronizadas com WhatsApp
// =====================================================

export function useApagarMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, mensagemId, messageWahaId, paraTodos }: {
      conversaId: string; mensagemId: string; messageWahaId: string; paraTodos: boolean
    }) => conversasApi.apagarMensagem(conversaId, mensagemId, messageWahaId, paraTodos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
      toast.success('Mensagem apagada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao apagar mensagem')
    },
  })
}

export function useLimparConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversaId: string) => conversasApi.limparConversa(conversaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Conversa limpa')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao limpar conversa')
    },
  })
}

export function useApagarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversaId: string) => conversasApi.apagarConversa(conversaId),
    onMutate: async (conversaId: string) => {
      // AIDEV-NOTE: Optimistic update — remove da UI imediatamente
      await queryClient.cancelQueries({ queryKey: ['conversas'] })
      const previous = queryClient.getQueriesData({ queryKey: ['conversas'] })
      queryClient.setQueriesData({ queryKey: ['conversas'] }, (old: any) => {
        if (Array.isArray(old)) return old.filter((c: any) => c.id !== conversaId)
        return old
      })
      return { previous }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Conversa apagada')
    },
    onError: (error: Error, _conversaId, context) => {
      // Restaurar cache anterior em caso de erro
      if (context?.previous) {
        context.previous.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data)
        })
      }
      toast.error(error.message || 'Erro ao apagar conversa')
    },
  })
}

export function useArquivarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversaId: string) => conversasApi.arquivarConversa(conversaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Conversa arquivada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao arquivar conversa')
    },
  })
}

export function useDesarquivarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversaId: string) => conversasApi.desarquivarConversa(conversaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Conversa desarquivada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao desarquivar conversa')
    },
  })
}

export function useFixarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, fixar }: { conversaId: string; fixar: boolean }) =>
      conversasApi.fixarConversa(conversaId, fixar),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success(variables.fixar ? 'Conversa fixada' : 'Conversa desafixada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao fixar conversa')
    },
  })
}

export function useMarcarNaoLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversaId: string) => conversasApi.marcarNaoLida(conversaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Marcada como não lida')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como não lida')
    },
  })
}

export function useSilenciarConversa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, silenciar }: { conversaId: string; silenciar: boolean }) =>
      conversasApi.silenciarConversa(conversaId, silenciar),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversa'] })
      toast.success(variables.silenciar ? 'Notificações silenciadas' : 'Notificações ativadas')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao silenciar conversa')
    },
  })
}

// =====================================================
// Hooks para ações de mensagem (fixar, reagir, encaminhar)
// =====================================================

export function useFixarMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, mensagemId, messageWahaId }: {
      conversaId: string; mensagemId: string; messageWahaId: string
    }) => conversasApi.fixarMensagem(conversaId, mensagemId, messageWahaId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
      if (result.localOnly) {
        toast.info('Mensagem fixada apenas no CRM. O engine GOWS não suporta fixar no WhatsApp.')
      } else {
        toast.success('Mensagem fixada')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao fixar mensagem')
    },
  })
}

export function useDesafixarMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, mensagemId, messageWahaId }: {
      conversaId: string; mensagemId: string; messageWahaId: string
    }) => conversasApi.desafixarMensagem(conversaId, mensagemId, messageWahaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
      toast.success('Mensagem desafixada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao desafixar mensagem')
    },
  })
}

export function useReagirMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, messageWahaId, emoji }: {
      conversaId: string; messageWahaId: string; emoji: string
    }) => conversasApi.reagirMensagem(conversaId, messageWahaId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reagir à mensagem')
    },
  })
}

export function useEncaminharMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversaId, messageWahaId, destinoChatId }: {
      conversaId: string; messageWahaId: string; destinoChatId: string
    }) => conversasApi.encaminharMensagem(conversaId, messageWahaId, destinoChatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Mensagem encaminhada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao encaminhar mensagem')
    },
  })
}
