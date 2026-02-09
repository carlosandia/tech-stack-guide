/**
 * AIDEV-NOTE: React Query hooks para A/B Testing de Formulários
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formulariosApi } from '../services/formularios.api'
import { toast } from 'sonner'

export function useTestesAB(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'testes-ab'],
    queryFn: () => formulariosApi.listarTestesAB(formularioId!),
    enabled: !!formularioId,
  })
}

export function useTesteAB(testeId: string | null) {
  return useQuery({
    queryKey: ['testes-ab', testeId],
    queryFn: () => formulariosApi.buscarTesteAB(testeId!),
    enabled: !!testeId,
  })
}

export function useVariantesAB(testeId: string | null) {
  return useQuery({
    queryKey: ['testes-ab', testeId, 'variantes'],
    queryFn: () => formulariosApi.listarVariantesAB(testeId!),
    enabled: !!testeId,
  })
}

export function useCriarTesteAB(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof formulariosApi.criarTesteAB>[1]) =>
      formulariosApi.criarTesteAB(formularioId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'testes-ab'] })
      toast.success('Teste A/B criado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useIniciarTesteAB(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (testeId: string) => formulariosApi.iniciarTesteAB(testeId, formularioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'testes-ab'] })
      qc.invalidateQueries({ queryKey: ['formularios', formularioId] })
      toast.success('Teste A/B iniciado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePausarTesteAB(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (testeId: string) => formulariosApi.pausarTesteAB(testeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'testes-ab'] })
      toast.success('Teste A/B pausado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useConcluirTesteAB(formularioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (testeId: string) => formulariosApi.concluirTesteAB(testeId, formularioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formularios', formularioId, 'testes-ab'] })
      qc.invalidateQueries({ queryKey: ['formularios', formularioId] })
      toast.success('Teste A/B concluído')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCriarVarianteAB(testeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof formulariosApi.criarVarianteAB>[1]) =>
      formulariosApi.criarVarianteAB(testeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testes-ab', testeId, 'variantes'] })
      toast.success('Variante criada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useExcluirVarianteAB(testeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (varianteId: string) => formulariosApi.excluirVarianteAB(varianteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testes-ab', testeId, 'variantes'] })
      toast.success('Variante excluída')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
