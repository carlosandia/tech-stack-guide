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
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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
    mutationFn: ({ oportunidadeId, payload, enviar }: {
      oportunidadeId: string
      payload: { destinatario: string; assunto: string; corpo: string }
      enviar?: boolean
    }) => detalhesApi.criarEmail(oportunidadeId, payload, enviar),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

export function useConexaoEmail() {
  return useQuery({
    queryKey: ['conexao_email_status'],
    queryFn: () => detalhesApi.verificarConexaoEmail(),
    staleTime: 60 * 1000,
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
        tipo?: string
        local?: string
        data_inicio: string
        data_fim?: string
        participantes?: Array<{ email: string }>
        google_meet?: boolean
        notificacao_minutos?: number
        sincronizar_google?: boolean
      }
    }) => detalhesApi.criarReuniao(oportunidadeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

export function useAtualizarStatusReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reuniaoId, status, extras }: {
      reuniaoId: string
      status: string
      extras?: {
        motivo_noshow?: string
        motivo_noshow_id?: string
        motivo_cancelamento?: string
        observacoes_realizacao?: string
        observacoes_noshow?: string
      }
    }) => detalhesApi.atualizarStatusReuniao(reuniaoId, status, extras),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

export function useExcluirReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reuniaoId: string) => detalhesApi.excluirReuniao(reuniaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
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

export function useConexaoGoogle() {
  return useQuery({
    queryKey: ['conexao_google_status'],
    queryFn: () => detalhesApi.verificarConexaoGoogle(),
    staleTime: 60 * 1000,
  })
}

export function useReagendarReuniao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reuniaoOriginalId, oportunidadeId, payload }: {
      reuniaoOriginalId: string
      oportunidadeId: string
      payload: {
        titulo: string
        descricao?: string
        tipo?: string
        local?: string
        data_inicio: string
        data_fim?: string
        participantes?: Array<{ email: string }>
        google_meet?: boolean
        notificacao_minutos?: number
        sincronizar_google?: boolean
      }
    }) => detalhesApi.reagendarReuniao(reuniaoOriginalId, oportunidadeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes_oportunidade'] })
      queryClient.invalidateQueries({ queryKey: ['historico'] })
    },
  })
}

// =====================================================
// PRODUTOS DA OPORTUNIDADE
// =====================================================

export function useProdutosOportunidade(oportunidadeId: string | null) {
  return useQuery({
    queryKey: ['produtos_oportunidade', oportunidadeId],
    queryFn: () => detalhesApi.listarProdutosOportunidade(oportunidadeId!),
    enabled: !!oportunidadeId,
    staleTime: 15 * 1000,
  })
}

export function useAdicionarProdutoOp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oportunidadeId, produtoId, quantidade, precoUnitario, desconto }: {
      oportunidadeId: string
      produtoId: string
      quantidade: number
      precoUnitario: number
      desconto?: number
    }) => detalhesApi.adicionarProdutoOportunidade(oportunidadeId, produtoId, quantidade, precoUnitario, desconto || 0),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['oportunidade_detalhe'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useAtualizarProdutoOp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload, oportunidadeId }: {
      id: string
      payload: { quantidade?: number; preco_unitario?: number; desconto_percentual?: number }
      oportunidadeId: string
    }) => detalhesApi.atualizarProdutoOportunidade(id, payload, oportunidadeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['oportunidade_detalhe'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useRemoverProdutoOp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, oportunidadeId }: { id: string; oportunidadeId: string }) =>
      detalhesApi.removerProdutoOportunidade(id, oportunidadeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos_oportunidade', variables.oportunidadeId] })
      queryClient.invalidateQueries({ queryKey: ['oportunidade_detalhe'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

export function useBuscarProdutosCatalogo() {
  return useMutation({
    mutationFn: (busca: string) => detalhesApi.buscarProdutosCatalogo(busca),
  })
}
