/**
 * AIDEV-NOTE: React Query hooks para Config de Formulários
 * Popup, Newsletter, Etapas (Multi-step)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  formulariosApi,
  type ConfigPopup,
  type ConfigNewsletter,
  type EtapaFormulario,
} from '../services/formularios.api'

// =====================================================
// Popup
// =====================================================

export function useConfigPopup(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'config-popup'],
    queryFn: () => formulariosApi.buscarConfigPopup(formularioId!),
    enabled: !!formularioId,
  })
}

export function useSalvarConfigPopup(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ConfigPopup>) =>
      formulariosApi.salvarConfigPopup(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'config-popup'] })
      toast.success('Configurações do popup salvas')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao salvar config popup'),
  })
}

// =====================================================
// Newsletter
// =====================================================

export function useConfigNewsletter(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'config-newsletter'],
    queryFn: () => formulariosApi.buscarConfigNewsletter(formularioId!),
    enabled: !!formularioId,
  })
}

export function useSalvarConfigNewsletter(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ConfigNewsletter>) =>
      formulariosApi.salvarConfigNewsletter(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'config-newsletter'] })
      toast.success('Configurações da newsletter salvas')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao salvar config newsletter'),
  })
}

// =====================================================
// Etapas (Multi-step)
// =====================================================

export function useEtapasFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'etapas'],
    queryFn: () => formulariosApi.listarEtapas(formularioId!),
    enabled: !!formularioId,
  })
}

export function useCriarEtapa(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<EtapaFormulario>) =>
      formulariosApi.criarEtapa(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'etapas'] })
      toast.success('Etapa criada')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao criar etapa'),
  })
}

export function useAtualizarEtapa(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ etapaId, payload }: { etapaId: string; payload: Partial<EtapaFormulario> }) =>
      formulariosApi.atualizarEtapa(formularioId, etapaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'etapas'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao atualizar etapa'),
  })
}

export function useExcluirEtapa(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (etapaId: string) =>
      formulariosApi.excluirEtapa(formularioId, etapaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'etapas'] })
      toast.success('Etapa removida')
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao remover etapa'),
  })
}
