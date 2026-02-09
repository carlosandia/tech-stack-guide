/**
 * AIDEV-NOTE: Hook de realtime para emails via Supabase Realtime
 * Escuta INSERT na tabela emails_recebidos e invalida cache automaticamente
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useEmailRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
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
          // Invalidate all email queries to refresh lists
          queryClient.invalidateQueries({ queryKey: ['emails'] })
          queryClient.invalidateQueries({ queryKey: ['email'] })

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
          queryClient.invalidateQueries({ queryKey: ['emails'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
