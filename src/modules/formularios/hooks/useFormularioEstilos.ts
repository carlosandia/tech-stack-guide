/**
 * AIDEV-NOTE: React Query hooks para Estilos de Formulários
 * Conforme PRD-17 - Etapa F3
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formulariosApi, type EstiloFormulario, ESTILO_PADRAO } from '../services/formularios.api'

export function useEstilosFormulario(formularioId: string | null) {
  return useQuery({
    queryKey: ['formularios', formularioId, 'estilos'],
    queryFn: async () => {
      const estilos = await formulariosApi.buscarEstilos(formularioId!)
      if (!estilos) {
        // Return defaults if no custom styles
        return {
          ...ESTILO_PADRAO,
          id: '',
          formulario_id: formularioId!,
          criado_em: '',
          atualizado_em: '',
        } as EstiloFormulario
      }
      return estilos
    },
    enabled: !!formularioId,
  })
}

export function useSalvarEstilos(formularioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Pick<EstiloFormulario, 'container' | 'cabecalho' | 'campos' | 'botao' | 'pagina' | 'css_customizado'>>) =>
      formulariosApi.salvarEstilos(formularioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios', formularioId, 'estilos'] })
      toast.success('Estilos salvos')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao salvar estilos')
    },
  })
}
