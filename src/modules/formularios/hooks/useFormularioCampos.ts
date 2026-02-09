/**
 * AIDEV-NOTE: React Query hooks para Campos de Formulários
 * Conforme PRD-17 - Etapa F2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formulariosApi, type CampoFormulario } from '../services/formularios.api'

export function useCamposFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'campos'],
    queryFn: () => formulariosApi.listarCampos(formularioId!),
    enabled: !!formularioId,
  })
}

export function useCriarCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CampoFormulario>) =>
      formulariosApi.criarCampo(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      toast.success('Campo adicionado')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao adicionar campo')
    },
  })
}

export function useAtualizarCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campoId, payload }: { campoId: string; payload: Partial<CampoFormulario> }) =>
      formulariosApi.atualizarCampo(formularioId, campoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar campo')
    },
  })
}

export function useExcluirCampo(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campoId: string) =>
      formulariosApi.excluirCampo(formularioId, campoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
      toast.success('Campo removido')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao remover campo')
    },
  })
}

export function useReordenarCampos(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campos: { id: string; ordem: number }[]) =>
      formulariosApi.reordenarCampos(formularioId, campos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'campos'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao reordenar campos')
    },
  })
}
