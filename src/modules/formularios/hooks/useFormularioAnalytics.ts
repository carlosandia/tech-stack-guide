/**
 * AIDEV-NOTE: React Query hooks para Analytics de Formulários
 */

import { useQuery } from '@tanstack/react-query'
import { formulariosApi } from '../services/formularios.api'

export function useMetricasFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'metricas'],
    queryFn: () => formulariosApi.obterMetricas(formularioId!),
    enabled: !!formularioId,
  })
}

export function useFunilConversao(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'funil'],
    queryFn: () => formulariosApi.obterFunilConversao(formularioId!),
    enabled: !!formularioId,
  })
}

export function useDesempenhoCampos(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'desempenho-campos'],
    queryFn: () => formulariosApi.obterDesempenhoCampos(formularioId!),
    enabled: !!formularioId,
  })
}
