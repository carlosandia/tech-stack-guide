import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// AIDEV-NOTE: Safety net para erros de WebSocket do Vite HMR no preview
// Previne tela branca causada por unhandled promise rejection
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const msg = reason?.message || String(reason || '')
  if (
    msg.includes('WebSocket') ||
    msg.includes('WebSocket closed') ||
    msg.includes('closed without opened') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module')
  ) {
    event.preventDefault()
    console.warn('[HMR] Erro suprimido:', msg)
  }
})
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'

/**
 * AIDEV-NOTE: Ponto de entrada da aplicacao
 * Ordem dos providers e importante:
 * 1. BrowserRouter (routing)
 * 2. QueryProvider (cache e data fetching)
 * 3. AuthProvider (autenticacao - depende de QueryProvider)
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryProvider>
        <ErrorBoundary>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                className: 'text-sm',
              }}
            />
          </AuthProvider>
        </ErrorBoundary>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
