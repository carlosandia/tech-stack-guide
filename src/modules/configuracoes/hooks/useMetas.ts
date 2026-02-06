/**
 * AIDEV-NOTE: Hooks React Query para Metas Hierárquicas
 * Conforme PRD-05 - Sistema de Metas (Admin Only)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { metasApi } from '../services/configuracoes.api'

const KEYS = {
  metas: ['metas'] as const,
  metasEmpresa: ['metas', 'empresa'] as const,
  metasIndividuais: ['metas', 'individuais'] as const,
  ranking: ['metas', 'ranking'] as const,
  progresso: ['metas', 'progresso'] as const,
}

export function useMetas(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...KEYS.metas, params],
    queryFn: () => metasApi.listar(params),
  })
}

export function useMetasEmpresa() {
  return useQuery({
    queryKey: KEYS.metasEmpresa,
    queryFn: () => metasApi.buscarEmpresa(),
  })
}

export function useMetasIndividuais() {
  return useQuery({
    queryKey: KEYS.metasIndividuais,
    queryFn: () => metasApi.buscarIndividuais(),
  })
}

export function useRanking(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...KEYS.ranking, params],
    queryFn: () => metasApi.buscarRanking(params),
  })
}

export function useCriarMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => metasApi.criar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.metas })
    },
  })
}

export function useAtualizarMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      metasApi.atualizar(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.metas })
    },
  })
}

export function useExcluirMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => metasApi.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.metas })
    },
  })
}

export function useDistribuirMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      metasApi.distribuir(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.metas })
    },
  })
}
