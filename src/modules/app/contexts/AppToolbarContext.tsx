import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * AIDEV-NOTE: Contexto do Toolbar para módulo App (tenant)
 * Permite que páginas injetem ações, subtítulo e conteúdo central no toolbar
 * Mesmo padrão do AdminLayout e ConfiguracoesLayout
 */

interface AppToolbarContextType {
  actions: ReactNode
  setActions: (actions: ReactNode) => void
  subtitle: ReactNode
  setSubtitle: (subtitle: ReactNode) => void
  centerContent: ReactNode
  setCenterContent: (content: ReactNode) => void
}

const AppToolbarContext = createContext<AppToolbarContextType | undefined>(undefined)

export function AppToolbarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null)
  const [subtitle, setSubtitle] = useState<ReactNode>(null)
  const [centerContent, setCenterContent] = useState<ReactNode>(null)

  return (
    <AppToolbarContext.Provider value={{ actions, setActions, subtitle, setSubtitle, centerContent, setCenterContent }}>
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
