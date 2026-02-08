/**
 * AIDEV-NOTE: Hooks TanStack Query para Caixa de Entrada de Email (PRD-11)
 * Mesmo padrão dos hooks de conversas/contatos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailsApi } from '../services/emails.api'
import type {
  ListarEmailsParams,
  AtualizarEmailPayload,
  AcaoLotePayload,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      toast.success('Email movido para lixeira')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir email')
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
// Conexões
// =====================================================

export function useConexoesEmail() {
  return useQuery({
    queryKey: ['emails', 'conexoes'],
    queryFn: () => emailsApi.listarConexoes(),
  })
}
