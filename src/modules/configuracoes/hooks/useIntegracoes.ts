/**
 * AIDEV-NOTE: React Query hooks para Integrações OAuth
 * Conforme PRD-08 - Conexões com Plataformas Externas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  integracoesApi,
  type PlataformaIntegracao,
  type SmtpTestarPayload,
} from '../services/configuracoes.api'

// =====================================================
// Hooks Gerais
// =====================================================

export function useIntegracoes() {
  return useQuery({
    queryKey: ['configuracoes', 'integracoes'],
    queryFn: () => integracoesApi.listar(),
  })
}

export function useDesconectarIntegracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ plataforma, id }: { plataforma: PlataformaIntegracao; id?: string }) =>
      integracoesApi.desconectar(plataforma, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
      toast.success('Integração desconectada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao desconectar integração')
    },
  })
}

export function useSincronizarIntegracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => integracoesApi.sincronizar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
      toast.success('Sincronização iniciada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao sincronizar integração')
    },
  })
}

export function useObterAuthUrl() {
  return useMutation({
    mutationFn: ({ plataforma, redirect_uri }: { plataforma: PlataformaIntegracao; redirect_uri: string }) =>
      integracoesApi.obterAuthUrl(plataforma, redirect_uri),
    onError: () => {
      toast.error('Erro ao obter URL de autenticação')
    },
  })
}

export function useProcessarCallback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      plataforma,
      code,
      state,
      redirect_uri,
    }: {
      plataforma: PlataformaIntegracao
      code: string
      state: string
      redirect_uri: string
    }) => integracoesApi.processarCallback(plataforma, { code, state, redirect_uri }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
      toast.success('Integração conectada com sucesso')
    },
    onError: () => {
      toast.error('Erro ao processar autenticação')
    },
  })
}

// =====================================================
// WhatsApp Hooks
// =====================================================

export function useWhatsAppIniciarSessao() {
  return useMutation({
    mutationFn: () => integracoesApi.whatsapp.iniciarSessao(),
    onError: () => {
      toast.error('Erro ao iniciar sessão WhatsApp')
    },
  })
}

export function useWhatsAppQrCode() {
  return useMutation({
    mutationFn: () => integracoesApi.whatsapp.obterQrCode(),
    onError: () => {
      toast.error('Erro ao obter QR Code')
    },
  })
}

export function useWhatsAppStatus() {
  return useMutation({
    mutationFn: () => integracoesApi.whatsapp.obterStatus(),
  })
}

// =====================================================
// Email Hooks
// =====================================================

export function useEmailSmtpTestar() {
  return useMutation({
    mutationFn: (payload: SmtpTestarPayload) => integracoesApi.email.testarSmtp(payload),
    onError: () => {
      toast.error('Erro ao testar conexão SMTP')
    },
  })
}

export function useEmailSmtpSalvar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SmtpTestarPayload) => integracoesApi.email.salvarSmtp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'integracoes'] })
      toast.success('Conexão de email salva com sucesso')
    },
    onError: () => {
      toast.error('Erro ao salvar conexão de email')
    },
  })
}

export function useEmailSmtpDetectar() {
  return useMutation({
    mutationFn: (email: string) => integracoesApi.email.detectarSmtp(email),
  })
}

export function useEmailGmailAuthUrl() {
  return useMutation({
    mutationFn: () => integracoesApi.email.obterGmailAuthUrl(),
    onError: () => {
      toast.error('Erro ao obter URL de autenticação Gmail')
    },
  })
}
