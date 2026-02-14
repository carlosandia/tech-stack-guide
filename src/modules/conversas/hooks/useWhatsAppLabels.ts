/**
 * AIDEV-NOTE: Hooks React Query para gerenciamento de etiquetas WhatsApp
 * Labels sincronizadas bidirecionalmente via WAHA
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

export interface WhatsAppLabel {
  id: string
  waha_label_id: string
  nome: string
  cor_hex: string | null
  cor_codigo: number | null
}

export interface ConversaLabel {
  id: string
  label_id: string
  whatsapp_labels: WhatsAppLabel
}

/** Lista todas labels da organização */
export function useLabels() {
  const { user } = useAuth()
  const organizacaoId = user?.organizacao_id

  return useQuery({
    queryKey: ['whatsapp-labels', organizacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_labels')
        .select('id, waha_label_id, nome, cor_hex, cor_codigo')
        .order('nome')

      if (error) throw new Error(error.message)
      return (data || []) as WhatsAppLabel[]
    },
    enabled: !!organizacaoId,
  })
}

/** Labels de uma conversa específica */
export function useLabelsConversa(conversaId?: string | null) {
  return useQuery({
    queryKey: ['labels-conversa', conversaId],
    queryFn: async () => {
      if (!conversaId) return []

      const { data, error } = await supabase
        .from('conversas_labels')
        .select('id, label_id, whatsapp_labels(id, waha_label_id, nome, cor_hex, cor_codigo)')
        .eq('conversa_id', conversaId)

      if (error) throw new Error(error.message)
      return (data || []) as unknown as ConversaLabel[]
    },
    enabled: !!conversaId,
  })
}

/** Sincronizar labels do WhatsApp via WAHA */
export function useSincronizarLabels() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionName: string) => {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'labels_list', session_name: sessionName },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-labels'] })
    },
  })
}

/** Aplicar labels a um chat via WAHA */
export function useAplicarLabels() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionName, chatId, wahaLabelIds }: {
      sessionName: string
      chatId: string
      wahaLabelIds: string[]
    }) => {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: {
          action: 'labels_set_chat',
          session_name: sessionName,
          chat_id: chatId,
          label_ids: wahaLabelIds,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels-conversa'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
  })
}
