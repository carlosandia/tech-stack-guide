/**
 * AIDEV-NOTE: React Query hooks para Produtos e Categorias
 * Conforme PRD-05 - Catálogo de Produtos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produtosApi } from '../services/configuracoes.api'

// =====================================================
// Produtos
// =====================================================

export function useProdutos(params?: { categoria_id?: string; busca?: string; ativo?: string; recorrente?: string }) {
  return useQuery({
    queryKey: ['configuracoes', 'produtos', params],
    queryFn: () => produtosApi.listar(params),
  })
}

export function useCriarProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => produtosApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'produtos'] })
    },
  })
}

export function useAtualizarProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      produtosApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'produtos'] })
    },
  })
}

export function useExcluirProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => produtosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'produtos'] })
    },
  })
}

// =====================================================
// Categorias
// =====================================================

export function useCategorias() {
  return useQuery({
    queryKey: ['configuracoes', 'categorias'],
    queryFn: () => produtosApi.listarCategorias(),
  })
}

export function useCriarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => produtosApi.criarCategoria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'categorias'] })
    },
  })
}

export function useAtualizarCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      produtosApi.atualizarCategoria(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'categorias'] })
    },
  })
}

export function useExcluirCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => produtosApi.excluirCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'categorias'] })
    },
  })
}
