import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

/**
 * AIDEV-NOTE: Contexto para ações contextuais do Toolbar
 * Permite que páginas injetem botões/ações no toolbar do layout
 * Conforme Design System - Seção 11.3 Toolbar
 */

interface ToolbarContextValue {
  actions: ReactNode
  setActions: (node: ReactNode) => void
  subtitle: string | null
  setSubtitle: (text: string | null) => void
}

const ToolbarContext = createContext<ToolbarContextValue>({
  actions: null,
  setActions: () => {},
  subtitle: null,
  setSubtitle: () => {},
})

export function ToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null)
  const [subtitle, setSubtitleState] = useState<string | null>(null)

  const setActions = useCallback((node: ReactNode) => {
    setActionsState(node)
  }, [])

  const setSubtitle = useCallback((text: string | null) => {
    setSubtitleState(text)
  }, [])

  return (
    <ToolbarContext.Provider value={{ actions, setActions, subtitle, setSubtitle }}>
      {children}
    </ToolbarContext.Provider>
  )
}

export function useToolbar() {
  const context = useContext(ToolbarContext)
  if (!context) {
    throw new Error('useToolbar must be used within a ToolbarProvider')
  }
  return context
}

export { ToolbarContext }
