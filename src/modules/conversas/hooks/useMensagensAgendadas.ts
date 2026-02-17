/**
 * AIDEV-NOTE: Hook TanStack Query para mensagens agendadas (PRD-09)
 * Inclui validação de limites anti-spam (WAHA Plus)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversasApi } from '../services/conversas.api'
import { toast } from 'sonner'
import { addMinutes, addDays, isBefore, isAfter, differenceInMinutes } from 'date-fns'

// AIDEV-NOTE: Limites anti-spam para WAHA Plus (WhatsApp não oficial)
const LIMITES = {
  MAX_POR_CONVERSA: 3,
  MAX_POR_USUARIO: 15,
  INTERVALO_MIN_MINUTOS: 5,
  MIN_FUTURO_MINUTOS: 5,
  MAX_FUTURO_DIAS: 30,
}

export function useAgendadas(conversaId: string) {
  return useQuery({
    queryKey: ['mensagens-agendadas', conversaId],
    queryFn: () => conversasApi.listarAgendadas(conversaId),
    enabled: !!conversaId,
  })
}

export function useContarAgendadasConversa(conversaId: string) {
  return useQuery({
    queryKey: ['mensagens-agendadas-count', conversaId],
    queryFn: () => conversasApi.contarAgendadasConversa(conversaId),
    enabled: !!conversaId,
  })
}

export function useContarAgendadasUsuario() {
  return useQuery({
    queryKey: ['mensagens-agendadas-count-usuario'],
    queryFn: () => conversasApi.contarAgendadasUsuario(),
  })
}

export function useAgendarMensagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      conversaId: string
      tipo: 'text' | 'audio'
      conteudo: string
      agendado_para: string
      media_url?: string
    }) => {
      const agora = new Date()
      const dataAgendamento = new Date(params.agendado_para)

      // Validação: mínimo 5min no futuro
      if (isBefore(dataAgendamento, addMinutes(agora, LIMITES.MIN_FUTURO_MINUTOS))) {
        throw new Error(`Agendamento deve ser pelo menos ${LIMITES.MIN_FUTURO_MINUTOS} minutos no futuro`)
      }

      // Validação: máximo 30 dias
      if (isAfter(dataAgendamento, addDays(agora, LIMITES.MAX_FUTURO_DIAS))) {
        throw new Error(`Agendamento máximo de ${LIMITES.MAX_FUTURO_DIAS} dias no futuro`)
      }

      // Validação: limite por conversa
      const countConversa = await conversasApi.contarAgendadasConversa(params.conversaId)
      if (countConversa >= LIMITES.MAX_POR_CONVERSA) {
        throw new Error(`Limite de ${LIMITES.MAX_POR_CONVERSA} agendamentos por conversa atingido`)
      }

      // Validação: limite por usuário
      const countUsuario = await conversasApi.contarAgendadasUsuario()
      if (countUsuario >= LIMITES.MAX_POR_USUARIO) {
        throw new Error(`Limite de ${LIMITES.MAX_POR_USUARIO} agendamentos totais atingido`)
      }

      // Validação: intervalo mínimo entre agendamentos
      const ultimaAgendada = await conversasApi.ultimaAgendadaConversa(params.conversaId)
      if (ultimaAgendada) {
        const diff = Math.abs(differenceInMinutes(dataAgendamento, new Date(ultimaAgendada)))
        if (diff < LIMITES.INTERVALO_MIN_MINUTOS) {
          throw new Error(`Intervalo mínimo de ${LIMITES.INTERVALO_MIN_MINUTOS} minutos entre agendamentos`)
        }
      }

      return conversasApi.agendarMensagem(params.conversaId, {
        tipo: params.tipo,
        conteudo: params.conteudo,
        agendado_para: params.agendado_para,
        media_url: params.media_url,
      })
    },
    onSuccess: (_data, variables) => {
      toast.success('Mensagem agendada com sucesso')
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas-count', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas-count-usuario'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCancelarAgendada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; conversaId: string }) => {
      return conversasApi.cancelarAgendada(params.id)
    },
    onSuccess: (_data, variables) => {
      toast.success('Agendamento cancelado')
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas-count', variables.conversaId] })
      queryClient.invalidateQueries({ queryKey: ['mensagens-agendadas-count-usuario'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export { LIMITES as LIMITES_AGENDAMENTO }
