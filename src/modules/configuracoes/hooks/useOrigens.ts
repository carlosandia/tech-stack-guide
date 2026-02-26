/**
 * AIDEV-NOTE: Hook compartilhado para origens dinâmicas
 * Usado por Contatos, Negócios e Configurações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { origensApi, type Origem, type CriarOrigemPayload, type AtualizarOrigemPayload } from '../services/origens.api'
import { toast } from 'sonner'

const QUERY_KEY = ['origens']

export function useOrigens(apenasAtivas = false) {
  return useQuery<Origem[]>({
    queryKey: [...QUERY_KEY, { apenasAtivas }],
    queryFn: () => origensApi.listar(apenasAtivas),
    staleTime: 10 * 60 * 1000, // 10min
  })
}

export function useOrigensAtivas() {
  return useOrigens(true)
}

export function useCriarOrigem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CriarOrigemPayload) => origensApi.criar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Origem criada')
    },
    onError: (err: any) => {
      const msg = err?.message?.includes('duplicate')
        ? 'Já existe uma origem com esse nome'
        : 'Erro ao criar origem'
      toast.error(msg)
    },
  })
}

export function useAtualizarOrigem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarOrigemPayload }) =>
      origensApi.atualizar(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Origem atualizada')
    },
    onError: () => toast.error('Erro ao atualizar origem'),
  })
}

export function useExcluirOrigem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => origensApi.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Origem excluída')
    },
    onError: () => toast.error('Erro ao excluir origem'),
  })
}

/** Helper: dado um slug, retorna o label (nome) da origem */
export function getOrigemLabel(origens: Origem[] | undefined, slug: string | null | undefined): string {
  if (!slug) return 'Manual'
  if (!origens) return slug
  const found = origens.find(o => o.slug === slug)
  return found?.nome || slug
}
