import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

/**
 * AIDEV-NOTE: Contexto para ações contextuais do Toolbar no módulo Configurações
 * Mesmo padrão do admin/ToolbarContext
 * Conforme Design System - Seção 11.3 Toolbar
 */

interface ConfigToolbarContextValue {
  actions: ReactNode
  setActions: (node: ReactNode) => void
  subtitle: ReactNode
  setSubtitle: (node: ReactNode) => void
}

const ConfigToolbarContext = createContext<ConfigToolbarContextValue>({
  actions: null,
  setActions: () => {},
  subtitle: null,
  setSubtitle: () => {},
})

export function ConfigToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null)
  const [subtitle, setSubtitleState] = useState<ReactNode>(null)

  const setActions = useCallback((node: ReactNode) => {
    setActionsState(node)
  }, [])

  const setSubtitle = useCallback((node: ReactNode) => {
    setSubtitleState(node)
  }, [])

  return (
    <ConfigToolbarContext.Provider value={{ actions, setActions, subtitle, setSubtitle }}>
      {children}
    </ConfigToolbarContext.Provider>
  )
}

export function useConfigToolbar() {
  const context = useContext(ConfigToolbarContext)
  if (!context) {
    throw new Error('useConfigToolbar must be used within a ConfigToolbarProvider')
  }
  return context
}

export { ConfigToolbarContext }
