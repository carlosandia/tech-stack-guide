/**
 * AIDEV-NOTE: Hook para sincronizacao em tempo real de contatos
 * Usa Supabase Realtime para invalidar cache quando contatos sao alterados
 * PRD: melhorias-performance.md - Fase 4
 *
 * Funcionalidades:
 * - Escuta INSERT/UPDATE/DELETE na tabela contatos
 * - Filtra por organizacao_id do usuario
 * - Invalida queries do TanStack Query automaticamente
 * - Integrado ao sistema de cache existente
 */

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/providers/AuthProvider'

interface ContatosRealtimeOptions {
  /**
   * Callback opcional executado quando contato e criado
   */
  onInsert?: (contato: Record<string, unknown>) => void

  /**
   * Callback opcional executado quando contato e atualizado
   */
  onUpdate?: (contato: Record<string, unknown>) => void

  /**
   * Callback opcional executado quando contato e deletado
   */
  onDelete?: (contatoId: string) => void

  /**
   * Se true, desabilita a subscription (util para componentes condicionais)
   * @default false
   */
  enabled?: boolean
}

/**
 * Hook para sincronizar contatos em tempo real entre abas/usuarios
 *
 * @example
 * ```tsx
 * function ContatosPage() {
 *   // Ativa realtime - cache invalida automaticamente
 *   useContatosRealtime()
 *
 *   const { data: contatos } = useContatos()
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Com callbacks personalizados
 * useContatosRealtime({
 *   onInsert: (contato) => toast.info(`Novo contato: ${contato.nome}`),
 *   onUpdate: (contato) => console.log('Atualizado:', contato.id),
 * })
 * ```
 */
export function useContatosRealtime(options: ContatosRealtimeOptions = {}) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const organizacaoId = user?.organizacao_id

  const handleRealtimeChange = useCallback(
    (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      new: Record<string, unknown>
      old: Record<string, unknown>
    }) => {
      // Invalida queries de listagem de contatos
      queryClient.invalidateQueries({
        queryKey: ['contatos'],
      })

      // Callbacks personalizados
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new)
          break

        case 'UPDATE':
          // Invalida query especifica do contato
          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ['contatos', payload.new.id],
            })
          }
          onUpdate?.(payload.new)
          break

        case 'DELETE':
          // Remove contato do cache se existir
          if (payload.old?.id) {
            queryClient.removeQueries({
              queryKey: ['contatos', payload.old.id],
            })
            onDelete?.(payload.old.id as string)
          }
          break
      }
    },
    [queryClient, onInsert, onUpdate, onDelete]
  )

  useEffect(() => {
    // Nao ativar se desabilitado ou sem organizacao
    if (!enabled || !organizacaoId) {
      return
    }

    // Canal unico por tenant para evitar conflitos
    const channelName = `contatos-realtime-${organizacaoId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contatos',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        (payload) => {
          handleRealtimeChange(payload as any)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // eslint-disable-next-line no-console
          console.debug(`[Realtime] Contatos conectado: ${channelName}`)
        }
      })

    // Cleanup: remover channel quando componente desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, organizacaoId, handleRealtimeChange])
}

export default useContatosRealtime
