import { QueryClient, QueryClientProvider, type NetworkMode } from '@tanstack/react-query'
import { forwardRef, type ReactNode, useState } from 'react'

/**
 * AIDEV-NOTE: Provider central do TanStack Query
 * Configuracoes de cache e retry padronizadas para todo o app
 */

interface QueryProviderProps {
  children: ReactNode
}

export const QueryProvider = forwardRef<HTMLDivElement, QueryProviderProps>(function QueryProvider({ children }, _ref) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
           queries: {
             staleTime: 1000 * 60, // 1 minuto
             gcTime: 1000 * 60 * 5, // 5 minutos
             retry: 2, // 2 tentativas
             retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
             refetchOnWindowFocus: false,
             networkMode: 'always' as NetworkMode, // Sempre tentar, mesmo offline
           },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
})

QueryProvider.displayName = 'QueryProvider'
