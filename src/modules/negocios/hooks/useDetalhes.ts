/**
 * AIDEV-NOTE: Hooks para abas de detalhes da oportunidade
 * Tarefas, Documentos, E-mails, Reuniões
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { detalhesApi } from '../services/detalhes.api'

// =====================================================
// TAREFAS
// =====================================================

export function useTarefasOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['tarefas_oportunidade', oportunidadeId],
    queryFn: () => detalhesApi.listarTarefas(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useCriarTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oportunidadeId, payload }: {
      oportunidadeId: string
      payload: {
        titulo: string
        descricao?: string
        tipo?: string
        prioridade?: string
        data_vencimento?: string
        owner_id?: string
      }
    }) => detalhesApi.criarTarefa(oportunidadeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefas_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useAtualizarStatusTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tarefaId, status }: { tarefaId: string; status: string }) =>
      detalhesApi.atualizarStatusTarefa(tarefaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas_oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useExcluirTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tarefaId: string) => detalhesApi.excluirTarefa(tarefaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas_oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

// =====================================================
// DOCUMENTOS
// =====================================================

export function useDocumentosOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['documentos_oportunidade', oportunidadeId],
    queryFn: () => detalhesApi.listarDocumentos(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useUploadDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oportunidadeId, file }: { oportunidadeId: string; file: File }) =>
      detalhesApi.uploadDocumento(oportunidadeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos_oportunidade'] })
    },
  })
}

export function useExcluirDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentoId, storagePath }: { documentoId: string; storagePath: string }) =>
      detalhesApi.excluirDocumento(documentoId, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos_oportunidade'] })
    },
  })
}

// =====================================================
// E-MAILS
// =====================================================

export function useEmailsOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['emails_oportunidade', oportunidadeId],
    queryFn: () => detalhesApi.listarEmails(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useCriarEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oportunidadeId, payload }: {
      oportunidadeId: string
      payload: { destinatario: string; assunto: string; corpo: string }
    }) => detalhesApi.criarEmail(oportunidadeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails_oportunidade', variables.oportunidadeId] })
    },
  })
}

// =====================================================
// REUNIÕES
// =====================================================

export function useReunioesOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['reunioes_oportunidade', oportunidadeId],
    queryFn: () => detalhesApi.listarReunioes(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useCriarReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oportunidadeId, payload }: {
      oportunidadeId: string
      payload: {
        titulo: string
        descricao?: string
        local?: string
        data_inicio: string
        data_fim?: string
      }
    }) => detalhesApi.criarReuniao(oportunidadeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade', variables.oportunidadeId] })
    },
  })
}

export function useAtualizarStatusReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reuniaoId, status, extras }: {
      reuniaoId: string
      status: string
      extras?: { motivo_noshow?: string; motivo_noshow_id?: string }
    }) => detalhesApi.atualizarStatusReuniao(reuniaoId, status, extras),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade'] })
    },
  })
}

export function useExcluirReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reuniaoId: string) => detalhesApi.excluirReuniao(reuniaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade'] })
    },
  })
}

export function useMotivosNoShow() {
  return useQuery({
    queryKey: ['motivos_noshow'],
    queryFn: () => detalhesApi.listarMotivosNoShow(),
    staleTime: 60 * 1000,
  })
}
