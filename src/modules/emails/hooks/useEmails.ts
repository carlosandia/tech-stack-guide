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
    refetchInterval: 60000, // Atualiza a cada 1 min
  })
}

export function useEmail(id: string | null) {
  return useQuery({
    queryKey: ['email', id],
    queryFn: () => emailsApi.obter(id!),
    enabled: !!id,
  })
}

export function useContadorNaoLidos() {
  return useQuery({
    queryKey: ['emails', 'nao-lidos'],
    queryFn: () => emailsApi.contarNaoLidos(),
    refetchInterval: 30000, // Atualiza a cada 30s
  })
}

export function useAtualizarEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarEmailPayload }) =>
      emailsApi.atualizar(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', variables.id] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar email')
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
    mutationFn: (payload: EnviarEmailPayload) => emailsApi.enviarEmail(payload),
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

// =====================================================
// Conexões
// =====================================================

export function useConexoesEmail() {
  return useQuery({
    queryKey: ['emails', 'conexoes'],
    queryFn: () => emailsApi.listarConexoes(),
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
