/**
 * AIDEV-NOTE: Hook de presença para lista de conversas
 * Escuta broadcast Realtime para TODOS os chats de uma sessão
 * Retorna mapa chatId → PresenceStatus para exibir "digitando..." na lista
 * Não faz subscribe individual por chat (isso é feito pelo usePresence no header)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PresenceStatus } from './usePresence'

const WAHA_STATUS_MAP: Record<string, PresenceStatus> = {
  typing: 'composing',
  offline: 'unavailable',
  available: 'available',
  recording: 'recording',
  paused: 'paused',
  composing: 'composing',
  unavailable: 'unavailable',
}

function mapWahaStatus(raw: string | null | undefined): PresenceStatus {
  if (!raw) return null
  return WAHA_STATUS_MAP[raw] ?? (raw as PresenceStatus)
}

export function useListPresence(sessionName: string | null): Map<string, PresenceStatus> {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(new Map())

  const handleUpdate = useCallback((payload: any) => {
    const chatId = payload?.chatId || payload?.originalChatId
    if (!chatId) return
    const presences = payload.presences || []
    if (presences.length > 0) {
      const status = mapWahaStatus(presences[0].lastKnownPresence)
      setPresenceMap(prev => {
        const next = new Map(prev)
        if (status && status !== 'unavailable' && status !== 'paused') {
          next.set(chatId, status)
          // AIDEV-NOTE: Also set originalChatId for @lid resolution
          if (payload.originalChatId && payload.originalChatId !== chatId) {
            next.set(payload.originalChatId, status)
          }
        } else {
          next.delete(chatId)
          if (payload.originalChatId) next.delete(payload.originalChatId)
        }
        return next
      })
    }
  }, [])

  useEffect(() => {
    if (!sessionName) return

    // AIDEV-NOTE: Canal dedicado para presença na lista — webhook faz broadcast em ambos
    const channel = supabase.channel(`list-presence:${sessionName}`)
      .on('broadcast', { event: 'presence_update' }, ({ payload }) => {
        handleUpdate(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionName, handleUpdate])

  return presenceMap
}
