/**
 * AIDEV-NOTE: Contexto de relógio SLA — Performance Fase 2.6
 * Um único setInterval(1000) compartilhado por todos os KanbanCards
 * Elimina N timers simultâneos (100 cards = 100 intervals → 1 interval)
 */

import { createContext, useContext, useState, useEffect } from 'react'

const SlaClockContext = createContext<number>(Date.now())

export function SlaClockProvider({ children }: { children: React.ReactNode }) {
  const [agora, setAgora] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <SlaClockContext.Provider value={agora}>
      {children}
    </SlaClockContext.Provider>
  )
}

/** Retorna o timestamp atual (Date.now()) atualizado a cada segundo. */
export function useSlaAgora(): number {
  return useContext(SlaClockContext)
}
