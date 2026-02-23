import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  AplicarGratuidadeData,
  AtualizarParceiroData,
  CriarParceiroData,
  AtualizarConfigProgramaData,
  GerarComissoesData,
} from '../schemas/parceiro.schema'
import {
  aplicarGratuidade,
  atualizarConfigPrograma,
  atualizarParceiro,
  criarParceiro,
  gerarComissoesMes,
  listarComissoesParceiro,
  listarIndicacoesParceiro,
  listarParceiros,
  marcarComissaoPaga,
  obterConfigPrograma,
  obterParceiro,
} from '../services/parceiros.api'

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export function useParceiros(params?: {
  busca?: string
  status?: 'ativo' | 'suspenso' | 'inativo'
  page?: number
}) {
  return useQuery({
    queryKey: ['admin', 'parceiros', params],
    queryFn: () => listarParceiros(params),
    staleTime: 30_000,
  })
}

export function useParceiro(id: string) {
  return useQuery({
    queryKey: ['admin', 'parceiro', id],
    queryFn: () => obterParceiro(id),
    enabled: !!id,
  })
}

export function useIndicacoesParceiro(parceiroId: string) {
  return useQuery({
    queryKey: ['admin', 'parceiro', parceiroId, 'indicacoes'],
    queryFn: () => listarIndicacoesParceiro(parceiroId),
    enabled: !!parceiroId,
  })
}

export function useComissoesParceiro(parceiroId: string, params?: { page?: number }) {
  return useQuery({
    queryKey: ['admin', 'parceiro', parceiroId, 'comissoes', params],
    queryFn: () => listarComissoesParceiro(parceiroId, params),
    enabled: !!parceiroId,
  })
}

export function useConfigPrograma() {
  return useQuery({
    queryKey: ['admin', 'config-programa-parceiros'],
    queryFn: () => obterConfigPrograma(),
    staleTime: 60_000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateParceiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CriarParceiroData) => criarParceiro(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiros'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'parceiros'] })
      toast.success('Parceiro cadastrado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateParceiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtualizarParceiroData }) =>
      atualizarParceiro(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiros'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiro', variables.id] })
      toast.success('Parceiro atualizado')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAplicarGratuidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AplicarGratuidadeData) => aplicarGratuidade(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'parceiro', variables.parceiro_id],
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiros'] })
      toast.success('Gratuidade aplicada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useGerarComissoes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GerarComissoesData) => gerarComissoesMes(data),
    onSuccess: (result, variables) => {
      if (variables.parceiro_id) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'parceiro', variables.parceiro_id, 'comissoes'],
        })
      } else {
        // Geração global: invalidar todas as comissões
        queryClient.invalidateQueries({ queryKey: ['admin', 'parceiro'] })
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiros'] })
      toast.success(
        `${result.geradas} comissão(ões) gerada(s)${result.ignoradas > 0 ? ` · ${result.ignoradas} já existiam` : ''}`,
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useMarcarComissaoPaga() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (comissaoId: string) => marcarComissaoPaga(comissaoId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'parceiro', result.parceiro_id, 'comissoes'],
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'parceiros'] })
      toast.success('Comissão marcada como paga')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateConfigPrograma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AtualizarConfigProgramaData) => atualizarConfigPrograma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config-programa-parceiros'] })
      toast.success('Configurações do programa salvas')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK DERIVADO — Status da Meta de Gratuidade
// ─────────────────────────────────────────────────────────────────────────────

export function useStatusMetaParceiro(parceiroId: string) {
  const { data: parceiro } = useParceiro(parceiroId)
  const { data: config } = useConfigPrograma()

  if (!parceiro || !config) {
    return {
      programaAtivo: false,
      cumpriuMeta: false,
      indicadosNecessarios: 0,
      indicadosAtuais: 0,
      percentualProgresso: 0,
      descricao: 'Carregando...',
    }
  }

  const regras = config.regras_gratuidade

  if (!regras.ativo) {
    return {
      programaAtivo: false,
      cumpriuMeta: false,
      indicadosNecessarios: 0,
      indicadosAtuais: parceiro.total_indicados_ativos ?? 0,
      percentualProgresso: 0,
      descricao: 'Programa de gratuidade inativo',
    }
  }

  // Se já teve gratuidade aplicada, usa meta de renovação; se não, usa meta inicial
  const meta = parceiro.gratuidade_aplicada_em
    ? (regras.renovacao_meta_indicados ?? regras.meta_inicial_indicados ?? 0)
    : (regras.meta_inicial_indicados ?? 0)

  const indicadosAtuais = parceiro.total_indicados_ativos ?? 0
  const cumpriuMeta = meta > 0 && indicadosAtuais >= meta
  const percentualProgresso = meta > 0 ? Math.min(100, (indicadosAtuais / meta) * 100) : 0

  let descricao: string
  if (cumpriuMeta) {
    descricao = `Meta cumprida: ${indicadosAtuais}/${meta} indicado(s) ativo(s)`
  } else if (meta > 0) {
    descricao = `${indicadosAtuais}/${meta} indicado(s) ativo(s) para gratuidade`
  } else {
    descricao = 'Meta não configurada'
  }

  return {
    programaAtivo: true,
    cumpriuMeta,
    indicadosNecessarios: meta,
    indicadosAtuais,
    percentualProgresso,
    descricao,
  }
}
