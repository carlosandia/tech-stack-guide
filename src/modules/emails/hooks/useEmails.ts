/**
 * AIDEV-NOTE: Hooks TanStack Query para Caixa de Entrada de Email (PRD-11)
 * Mesmo padrão dos hooks de conversas/contatos
 */

import { useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailsApi } from '../services/emails.api'
import type {
  ListarEmailsParams,
  AtualizarEmailPayload,
  AcaoLotePayload,
  EnviarEmailPayload,
  SalvarRascunhoPayload,
} from '../types/email.types'
import { toast } from 'sonner'

// =====================================================
// Emails
// =====================================================

export function useEmails(params: ListarEmailsParams = {}) {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailsApi.listar(params),
    // AIDEV-NOTE: Polling removido — useEmailRealtime + useAutoSyncEmails já cuidam da atualização
    staleTime: 2 * 60 * 1000,   // 2 minutos — lista de emails (Performance 1.1)
    gcTime: 10 * 60 * 1000,     // 10 minutos em cache
    refetchOnWindowFocus: false, // Realtime invalida quando necessário
  })
}

export function useEmail(id: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['email', id],
    queryFn: async () => {
      const email = await emailsApi.obter(id!)

      // AIDEV-NOTE: Lazy loading — se o email não tem corpo, buscar via IMAP on-demand
      if (!email.corpo_html && !email.corpo_texto && email.provider_id) {
        try {
          const body = await emailsApi.fetchEmailBody(id!)
          email.corpo_html = body.corpo_html
          email.corpo_texto = body.corpo_texto
          // Atualizar cache com o corpo carregado
          queryClient.setQueryData(['email', id], email)
        } catch (err) {
          console.warn('[useEmail] Lazy load body failed:', (err as Error).message)
        }
      }

      return email
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,   // 5 minutos — email individual (Performance 1.1)
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useContadorNaoLidos() {
  return useQuery({
    queryKey: ['emails', 'nao-lidos'],
    queryFn: () => emailsApi.contarNaoLidos(),
    // AIDEV-NOTE: Polling removido — useEmailRealtime invalida cache em tempo real
    staleTime: 60 * 1000,        // 1 minuto — contador de não lidos (Performance 1.1)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useAtualizarEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarEmailPayload }) =>
      emailsApi.atualizar(id, payload),
    onMutate: async ({ id, payload }) => {
      // AIDEV-NOTE: Optimistic update para refletir imediatamente na UI (ex: marcar como lido)
      await queryClient.cancelQueries({ queryKey: ['emails'] })
      const previousEmails = queryClient.getQueryData(['emails'])

      queryClient.setQueriesData({ queryKey: ['emails'] }, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((e: any) => (e.id === id ? { ...e, ...payload } : e)),
        }
      })

      // Also update the individual email cache
      queryClient.setQueryData(['email', id], (old: any) => {
        if (!old) return old
        return { ...old, ...payload }
      })

      return { previousEmails }
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousEmails) {
        queryClient.setQueriesData({ queryKey: ['emails'] }, context.previousEmails)
      }
      toast.error(error.message || 'Erro ao atualizar email')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', variables.id] })
    },
  })
}

export function useDeletarEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => emailsApi.deletar(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      toast.success(data.mensagem || 'Email excluído')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir email')
    },
  })
}

export function useTraduzirEmail() {
  return useMutation({
    mutationFn: (emailId: string) => emailsApi.traduzirEmail(emailId),
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao traduzir email')
    },
  })
}

export function useEnviarEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: EnviarEmailPayload & { anexos?: File[] }) => emailsApi.enviarEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      toast.success('Email enviado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar email')
    },
  })
}

export function useAcaoLote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AcaoLotePayload) => emailsApi.acaoLote(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      const msgs: Record<string, string> = {
        marcar_lido: 'Marcados como lidos',
        marcar_nao_lido: 'Marcados como não lidos',
        arquivar: 'Emails arquivados',
        mover_lixeira: 'Movidos para lixeira',
        favoritar: 'Favoritados',
        desfavoritar: 'Removidos dos favoritos',
        restaurar: 'Restaurados para caixa de entrada',
      }
      toast.success(msgs[variables.acao] || 'Ação realizada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao executar ação em lote')
    },
  })
}

// =====================================================
// Rascunhos
// =====================================================

export function useRascunhos() {
  return useQuery({
    queryKey: ['emails', 'rascunhos'],
    queryFn: () => emailsApi.listarRascunhos(),
    staleTime: 3 * 60 * 1000,   // 3 minutos — rascunhos (Performance 1.1)
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useSalvarRascunho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalvarRascunhoPayload) => emailsApi.salvarRascunho(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'rascunhos'] })
      toast.success('Rascunho salvo')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar rascunho')
    },
  })
}

export function useDeletarRascunho() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => emailsApi.deletarRascunho(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'rascunhos'] })
      toast.success('Rascunho excluído')
    },
  })
}

// =====================================================
// Assinatura
// =====================================================

export function useAssinatura() {
  return useQuery({
    queryKey: ['emails', 'assinatura'],
    queryFn: () => emailsApi.obterAssinatura(),
    staleTime: 15 * 60 * 1000,  // 15 minutos — assinatura raramente muda (Performance 1.1)
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useSalvarAssinatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: emailsApi.salvarAssinatura,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', 'assinatura'] })
      toast.success('Assinatura salva')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao salvar assinatura')
    },
  })
}

// =====================================================
// Sincronização IMAP
// =====================================================

export function useSincronizarEmails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => emailsApi.sincronizarEmails(),
    onSuccess: (data) => {
      // Invalidate ALL email queries — list AND individual emails
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email'] })

      const parts: string[] = []
      if (data.novos > 0) parts.push(`${data.novos} novo(s)`)
      if (data.atualizados > 0) parts.push(`${data.atualizados} atualizado(s)`)

      if (parts.length > 0) {
        toast.success(`Sincronizado: ${parts.join(', ')}`)
      } else {
        toast.info('Nenhum email novo')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao sincronizar emails')
    },
  })
}

/**
 * Auto-sync IMAP silencioso a cada 2 minutos.
 * Não exibe toast quando não há novos emails.
 */
export function useAutoSyncEmails() {
  const queryClient = useQueryClient()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    const doSync = async () => {
      if (isSyncingRef.current) return
      isSyncingRef.current = true
      try {
        const result = await emailsApi.sincronizarEmails()
        if (result.novos > 0 || result.atualizados > 0) {
          queryClient.invalidateQueries({ queryKey: ['emails'] })
          queryClient.invalidateQueries({ queryKey: ['email'] })
          // Notificação removida aqui — useEmailRealtime já cuida das notificações individuais
        }
      } catch {
        // Silencioso — erros de auto-sync não devem interromper o usuário
      } finally {
        isSyncingRef.current = false
      }
    }

    // Sync inicial ao montar
    doSync()

    // Auto-sync a cada 2 minutos
    intervalRef.current = setInterval(doSync, 120_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [queryClient])
}

// =====================================================
// Conexões
// =====================================================

export function useConexoesEmail() {
  return useQuery({
    queryKey: ['emails', 'conexoes'],
    queryFn: () => emailsApi.listarConexoes(),
    staleTime: 15 * 60 * 1000,  // 15 minutos — conexões raramente mudam (Performance 1.1)
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// =====================================================
// Notificação de novos emails
// =====================================================

export function useNewEmailNotification() {
  const prevCount = useRef<number | null>(null)
  const { data } = useContadorNaoLidos()

  useEffect(() => {
    if (data && prevCount.current !== null && data.inbox > prevCount.current) {
      const newCount = data.inbox - prevCount.current
      toast.info(`${newCount} novo${newCount > 1 ? 's' : ''} email${newCount > 1 ? 's' : ''}`, {
        description: 'na caixa de entrada',
      })
    }
    if (data) {
      prevCount.current = data.inbox
    }
  }, [data?.inbox]) // eslint-disable-line react-hooks/exhaustive-deps
}
