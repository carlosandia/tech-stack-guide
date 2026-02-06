import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * AIDEV-NOTE: Contexto do Toolbar para módulo App (tenant)
 * Permite que páginas injetem ações e subtítulo no toolbar
 * Mesmo padrão do AdminLayout e ConfiguracoesLayout
 */

interface AppToolbarContextType {
  actions: ReactNode
  setActions: (actions: ReactNode) => void
  subtitle: string
  setSubtitle: (subtitle: string) => void
}

const AppToolbarContext = createContext<AppToolbarContextType | undefined>(undefined)

export function AppToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null)
  const [subtitle, setSubtitle] = useState('')

  return (
    <AppToolbarContext.Provider value={{ actions, setActions, subtitle, setSubtitle }}>
      {children}
    </AppToolbarContext.Provider>
  )
}

export function useAppToolbar() {
  const context = useContext(AppToolbarContext)
  if (!context) {
    throw new Error('useAppToolbar deve ser usado dentro de AppToolbarProvider')
  }
  return context
}
