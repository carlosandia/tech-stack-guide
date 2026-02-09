/**
 * AIDEV-NOTE: React Query hooks para Submissões de Formulários
 */

import { useQuery } from '@tanstack/react-query'
import {
  formulariosApi,
  type ListarSubmissoesParams,
} from '../services/formularios.api'

export function useSubmissoesFormulario(params: ListarSubmissoesParams | null) {
  return useQuery({
    queryKey: ['formularios', params?.formularioId, 'submissoes', params?.status, params?.pagina],
    queryFn: () => formulariosApi.listarSubmissoes(params!),
    enabled: !!params?.formularioId,
  })
}

export function useSubmissaoDetalhe(submissaoId: string | null) {
  return useQuery({
    queryKey: ['submissoes', submissaoId],
    queryFn: () => formulariosApi.buscarSubmissao(submissaoId!),
    enabled: !!submissaoId,
  })
}
