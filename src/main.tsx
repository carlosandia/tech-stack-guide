import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
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
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
