/**
 * AIDEV-NOTE: React Query hooks para Formulários
 * Conforme PRD-17 - Módulo de Formulários
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formulariosApi, type ListarFormulariosParams, type TipoFormulario } from '../services/formularios.api'

export function useFormularios(params?: ListarFormulariosParams) {
  return useQuery({
    queryKey: ['formularios', params],
    queryFn: () => formulariosApi.listar(params),
  })
}

export function useFormulario(id: string | null) {
  return useQuery({
    queryKey: ['formularios', id],
    queryFn: () => formulariosApi.buscar(id!),
    enabled: !!id,
  })
}

export function useContadoresFormularios() {
  return useQuery({
    queryKey: ['formularios', 'contadores'],
    queryFn: () => formulariosApi.contarPorStatus(),
  })
}

export function useCriarFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { nome: string; tipo: TipoFormulario; descricao?: string }) =>
      formulariosApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário criado com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao criar formulário')
    },
  })
}

export function useAtualizarFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      formulariosApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário atualizado com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar formulário')
    },
  })
}

export function useExcluirFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formulariosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário excluído com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao excluir formulário')
    },
  })
}

export function useDuplicarFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formulariosApi.duplicar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário duplicado com sucesso')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao duplicar formulário')
    },
  })
}

export function usePublicarFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formulariosApi.publicar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário publicado')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao publicar formulário')
    },
  })
}

export function useDespublicarFormulario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formulariosApi.despublicar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios'] })
      toast.success('Formulário despublicado')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao despublicar formulário')
    },
  })
}
