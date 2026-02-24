/**
 * AIDEV-NOTE: Hook de presença WhatsApp (online/digitando/gravando)
 * Usa WAHA presence_subscribe + presence_get via waha-proxy
 * Escuta Realtime Broadcast para updates em tempo real
 * Retorna null quando não há dados ou canal não é WhatsApp
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export type PresenceStatus = 'available' | 'unavailable' | 'composing' | 'recording' | 'paused' | null

interface PresenceResult {
  status: PresenceStatus
  lastSeen: number | null
}

export function usePresence(
  chatId: string | null | undefined,
  sessionName: string | null | undefined,
  canal: string | null | undefined,
): PresenceResult {
  const [status, setStatus] = useState<PresenceStatus>(null)
  const [lastSeen, setLastSeen] = useState<number | null>(null)
  const subscribedRef = useRef(false)

  useEffect(() => {
    if (canal !== 'whatsapp' || !sessionName || !chatId) {
      setStatus(null)
      return
    }

    subscribedRef.current = false

    // Subscribe to presence updates via waha-proxy
    supabase.functions.invoke('waha-proxy', {
      body: { action: 'presence_subscribe', chat_id: chatId, session_name: sessionName },
    }).then(() => {
      subscribedRef.current = true
    }).catch((err) => {
      console.warn('[usePresence] subscribe error:', err)
    })

    // Get initial presence
    supabase.functions.invoke('waha-proxy', {
      body: { action: 'presence_get', chat_id: chatId, session_name: sessionName },
    }).then(({ data }) => {
      if (data?.waha_unsupported) return
      // AIDEV-NOTE: WAHA retorna array de presences ou objeto direto
      const presences = data?.presences || (data?.lastKnownPresence ? [data] : [])
      if (presences.length > 0) {
        const p = presences[0]
        setStatus(p.lastKnownPresence || null)
        setLastSeen(p.lastSeen || null)
      }
    }).catch((err) => {
      console.warn('[usePresence] get error:', err)
    })

    // Listen for broadcast updates
    const channel = supabase.channel(`presence:${sessionName}`)
      .on('broadcast', { event: 'presence_update' }, ({ payload }) => {
        if (payload?.chatId === chatId) {
          const presences = payload.presences || []
          if (presences.length > 0) {
            const p = presences[0]
            setStatus(p.lastKnownPresence || 'unavailable')
            setLastSeen(p.lastSeen || null)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, sessionName, canal])

  return { status, lastSeen }
}
