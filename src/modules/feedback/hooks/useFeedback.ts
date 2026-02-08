/**
 * AIDEV-NOTE: Hooks React Query para Feedbacks (PRD-15)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/providers/AuthProvider'
import { feedbackApi, type ListarFeedbacksFiltros, type TipoFeedback } from '../services/feedback.api'

/**
 * Criar feedback (Admin/Member)
 */
export function useCriarFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: { tipo: TipoFeedback; descricao: string }) => {
      if (!user?.id || !user?.organizacao_id) {
        throw new Error('Usuário não autenticado')
      }
      return feedbackApi.criar({
        organizacao_id: user.organizacao_id,
        usuario_id: user.id,
        tipo: dados.tipo,
        descricao: dados.descricao,
      })
    },
    onSuccess: () => {
      toast.success('Feedback enviado com sucesso! Obrigado pela contribuição.')
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
    onError: () => {
      toast.error('Erro ao enviar feedback. Tente novamente.')
    },
  })
}

/**
 * Listar feedbacks (Super Admin)
 */
export function useFeedbacksAdmin(filtros: ListarFeedbacksFiltros) {
  return useQuery({
    queryKey: ['feedbacks', 'admin', filtros],
    queryFn: () => feedbackApi.listarAdmin(filtros),
  })
}

/**
 * Resolver feedback (Super Admin)
 */
export function useResolverFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (feedbackId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado')
      return feedbackApi.resolver(feedbackId, user.id)
    },
    onSuccess: () => {
      toast.success('Feedback marcado como resolvido.')
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao resolver feedback.')
    },
  })
}
