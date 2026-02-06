/**
 * AIDEV-NOTE: React Query hooks para Contatos
 * Conforme PRD-06 - Modulo de Contatos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contatosApi, type ListarContatosParams } from '../services/contatos.api'

export function useContatos(params?: ListarContatosParams) {
  return useQuery({
    queryKey: ['contatos', params],
    queryFn: () => contatosApi.listar(params),
  })
}

export function useContato(id: string | null) {
  return useQuery({
    queryKey: ['contatos', id],
    queryFn: () => contatosApi.buscar(id!),
    enabled: !!id,
  })
}

export function useCriarContato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => contatosApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contato criado com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao criar contato')
    },
  })
}

export function useAtualizarContato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      contatosApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contato atualizado com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao atualizar contato')
    },
  })
}

export function useExcluirContato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contatosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contato excluído com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao excluir contato')
    },
  })
}

export function useExcluirContatosLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ids: string[]; tipo: 'pessoa' | 'empresa' }) =>
      contatosApi.excluirLote(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      if (result.erros.length > 0) {
        toast.warning(`${result.excluidos} excluído(s), ${result.erros.length} com erro`)
      } else {
        toast.success(`${result.excluidos} contato(s) excluído(s)`)
      }
    },
    onError: () => {
      toast.error('Erro ao excluir contatos')
    },
  })
}

export function useAtribuirContatosLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ids: string[]; owner_id: string | null }) =>
      contatosApi.atribuirLote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contatos atribuídos com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atribuir contatos')
    },
  })
}

export function useDuplicatas() {
  return useQuery({
    queryKey: ['contatos', 'duplicatas'],
    queryFn: () => contatosApi.duplicatas(),
  })
}

export function useMesclarContatos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { contato_manter_id: string; contato_mesclar_id: string; campos_mesclar?: string[] }) =>
      contatosApi.mesclar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contatos mesclados com sucesso')
    },
    onError: () => {
      toast.error('Erro ao mesclar contatos')
    },
  })
}
