import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * AIDEV-NOTE: Error Boundary global para capturar erros nao tratados
 * Evita tela branca total ao exibir fallback com opcao de recarregar.
 * React 18 exige class components para Error Boundaries.
 */

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo)

    // AIDEV-NOTE: Auto-reload silencioso para chunk errors (2a tentativa).
    // O lazyWithRetry já fez a 1a tentativa. Se chegou aqui, tentamos
    // mais uma vez antes de exibir o fallback visual.
    const msg = error?.message?.toLowerCase() || ''
    const isChunk =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('loading css chunk')

    if (isChunk && !sessionStorage.getItem('eb-chunk-reload')) {
      sessionStorage.setItem('eb-chunk-reload', '1')
      // Limpar flags do lazyWithRetry para evitar conflito
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('chunk-reload-')) sessionStorage.removeItem(key)
      })
      window.location.reload()
      return
    }
  }

  handleReload = () => {
    // AIDEV-NOTE: Limpar todas as chaves de chunk retry do sessionStorage
    // e fazer hard reload para a URL raiz (sem query params de cache-busting)
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('chunk-reload-') || key === 'eb-chunk-reload') {
        sessionStorage.removeItem(key)
      }
    })
    window.location.href = window.location.origin + window.location.pathname
  }


  private isChunkError(): boolean {
    const msg = this.state.error?.message?.toLowerCase() || ''
    return (
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('loading css chunk')
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isChunk = this.isChunkError()

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md bg-card rounded-lg border border-border p-8 shadow-lg text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isChunk ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              <AlertCircle className={`w-8 h-8 ${isChunk ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {isChunk ? 'Nova versão disponível' : 'Algo deu errado'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isChunk
                ? 'Uma atualização foi publicada. Clique abaixo para carregar a versão mais recente.'
                : 'Ocorreu um erro inesperado. Tente recarregar a página.'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full h-11 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              {isChunk ? 'Atualizar agora' : 'Recarregar página'}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
