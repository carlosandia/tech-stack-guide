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
// HOOK DERIVADO — Status do Nível Gamificado do Parceiro
// AIDEV-NOTE: Calcula nível atual baseado nos níveis configurados no JSONB
// ─────────────────────────────────────────────────────────────────────────────

import type { NivelParceiro } from '../schemas/parceiro.schema'

export interface StatusNivelParceiro {
  programaAtivo: boolean
  nivelAtual: NivelParceiro | null
  proximoNivel: NivelParceiro | null
  indicadosAtuais: number
  indicadosFaltam: number
  percentualProgresso: number
  descricao: string
  // Retrocompat
  cumpriuMeta: boolean
  indicadosNecessarios: number
}

export function useStatusMetaParceiro(parceiroId: string): StatusNivelParceiro {
  const { data: parceiro } = useParceiro(parceiroId)
  const { data: config } = useConfigPrograma()

  const vazio: StatusNivelParceiro = {
    programaAtivo: false,
    nivelAtual: null,
    proximoNivel: null,
    indicadosAtuais: 0,
    indicadosFaltam: 0,
    percentualProgresso: 0,
    descricao: 'Carregando...',
    cumpriuMeta: false,
    indicadosNecessarios: 0,
  }

  if (!parceiro || !config) return vazio

  const regras = config.regras_gratuidade

  if (!regras.ativo) {
    return { ...vazio, indicadosAtuais: parceiro.total_indicados_ativos ?? 0, descricao: 'Programa de níveis inativo' }
  }

  const niveis = [...(regras.niveis ?? [])].sort((a, b) => a.meta_indicados - b.meta_indicados)

  if (niveis.length === 0) {
    return { ...vazio, programaAtivo: true, indicadosAtuais: parceiro.total_indicados_ativos ?? 0, descricao: 'Nenhum nível configurado' }
  }

  const indicadosAtuais = parceiro.total_indicados_ativos ?? 0

  // AIDEV-NOTE: Se tem nivel_override, usar diretamente em vez de calcular
  if (parceiro.nivel_override) {
    const nivelOverride = niveis.find((n: NivelParceiro) => n.nome === parceiro.nivel_override)
    if (nivelOverride) {
      const idxOverride = niveis.indexOf(nivelOverride)
      const proxOverride = niveis[idxOverride + 1] ?? null
      const faltamOverride = proxOverride ? Math.max(0, proxOverride.meta_indicados - indicadosAtuais) : 0
      let percOverride = 0
      if (proxOverride) {
        const baseO = nivelOverride.meta_indicados
        const rangeO = proxOverride.meta_indicados - baseO
        if (rangeO > 0) percOverride = Math.min(100, ((indicadosAtuais - baseO) / rangeO) * 100)
      } else {
        percOverride = 100
      }
      return {
        programaAtivo: true,
        nivelAtual: nivelOverride,
        proximoNivel: proxOverride,
        indicadosAtuais,
        indicadosFaltam: faltamOverride,
        percentualProgresso: percOverride,
        descricao: `${nivelOverride.nome} (definido manualmente)${proxOverride ? ` · Próximo: ${proxOverride.nome}` : ' · Nível máximo'}`,
        cumpriuMeta: true,
        indicadosNecessarios: proxOverride?.meta_indicados ?? nivelOverride.meta_indicados,
      }
    }
  }

  // Encontrar o maior nível onde meta_indicados <= indicadosAtuais
  let nivelAtual: NivelParceiro | null = null
  let proximoNivel: NivelParceiro | null = null

  for (let i = niveis.length - 1; i >= 0; i--) {
    if (indicadosAtuais >= niveis[i].meta_indicados) {
      nivelAtual = niveis[i]
      proximoNivel = niveis[i + 1] ?? null
      break
    }
  }

  // Se não atingiu nenhum nível, o próximo é o primeiro
  if (!nivelAtual) {
    proximoNivel = niveis[0]
  }

  const indicadosFaltam = proximoNivel ? Math.max(0, proximoNivel.meta_indicados - indicadosAtuais) : 0

  // Progresso: do nível atual ao próximo
  let percentualProgresso = 0
  if (proximoNivel) {
    const base = nivelAtual ? nivelAtual.meta_indicados : 0
    const range = proximoNivel.meta_indicados - base
    if (range > 0) {
      percentualProgresso = Math.min(100, ((indicadosAtuais - base) / range) * 100)
    }
  } else {
    percentualProgresso = 100 // Atingiu o nível máximo
  }

  let descricao: string
  if (!nivelAtual) {
    descricao = `Faltam ${indicadosFaltam} indicado(s) para ${proximoNivel!.nome}`
  } else if (proximoNivel) {
    descricao = `${nivelAtual.nome} · Faltam ${indicadosFaltam} para ${proximoNivel.nome}`
  } else {
    descricao = `${nivelAtual.nome} · Nível máximo atingido!`
  }

  return {
    programaAtivo: true,
    nivelAtual,
    proximoNivel,
    indicadosAtuais,
    indicadosFaltam,
    percentualProgresso,
    descricao,
    cumpriuMeta: nivelAtual !== null,
    indicadosNecessarios: proximoNivel?.meta_indicados ?? nivelAtual?.meta_indicados ?? 0,
  }
}
