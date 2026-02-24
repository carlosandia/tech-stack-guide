/**
 * AIDEV-NOTE: Hook de realtime para emails via Supabase Realtime
 * Escuta INSERT/UPDATE na tabela emails_recebidos e invalida cache com debounce de 2s
 * para evitar refetch storms durante sincronização IMAP em lote
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useEmailRealtime() {
  const queryClient = useQueryClient()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const scheduleInvalidation = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['emails'] })
        queryClient.invalidateQueries({ queryKey: ['email'] })
      }, 5000) // AIDEV-NOTE: 5s — absorve bursts do IMAP sync em lote (Performance 1.3)
    }

    const channel = supabase
      .channel('emails-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails_recebidos',
        },
        (payload) => {
          // AIDEV-NOTE: Debounce invalidation — toast imediato, refetch com delay
          scheduleInvalidation()

          // Só notifica emails recebidos na inbox (não enviados, não arquivados)
          const newEmail = payload.new as any
          if (newEmail?.pasta === 'inbox') {
            const remetente = newEmail?.de_nome || newEmail?.de_email || 'Novo email'
            const assunto = newEmail?.assunto || '(sem assunto)'

            toast.info(`📧 ${remetente}`, {
              description: assunto,
              duration: 5000,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emails_recebidos',
        },
        () => {
          scheduleInvalidation()
        }
      )
      .subscribe()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
