/**
 * AIDEV-NOTE: React Query hooks para Segmentos
 * Conforme PRD-06 - Sistema de Segmentacao
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { segmentosApi, contatosApi } from '../services/contatos.api'

export function useSegmentos() {
  return useQuery({
    queryKey: ['segmentos'],
    queryFn: () => segmentosApi.listar(),
  })
}

export function useCriarSegmento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { nome: string; cor: string; descricao?: string }) =>
      segmentosApi.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmento criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar segmento')
    },
  })
}

export function useAtualizarSegmento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nome?: string; cor?: string; descricao?: string | null } }) =>
      segmentosApi.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmento atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar segmento')
    },
  })
}

export function useExcluirSegmento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => segmentosApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Segmento excluído com sucesso')
    },
    onError: () => {
      toast.error('Erro ao excluir segmento')
    },
  })
}

export function useVincularSegmentos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contatoId, segmentoIds }: { contatoId: string; segmentoIds: string[] }) =>
      contatosApi.vincularSegmentos(contatoId, segmentoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Segmentos atualizados')
    },
    onError: () => {
      toast.error('Erro ao atualizar segmentos')
    },
  })
}

export function useSegmentarLote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ids: string[]; adicionar: string[]; remover: string[] }) =>
      contatosApi.segmentarLote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      queryClient.invalidateQueries({ queryKey: ['segmentos'] })
      toast.success('Segmentação em massa aplicada')
    },
    onError: () => {
      toast.error('Erro na segmentação em massa')
    },
  })
}
