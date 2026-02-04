import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/admin.api'

/**
 * AIDEV-NOTE: React Query hooks para Configuracoes Globais
 * Conforme PRD-14 - Configuracoes da Plataforma
 */

// Listar todas as configuracoes globais
export function useConfigGlobais() {
  return useQuery({
    queryKey: ['admin', 'config-global'],
    queryFn: () => adminApi.listarConfigGlobais(),
  })
}

// Obter configuracao de uma plataforma especifica
export function useConfigGlobal(plataforma: string) {
  return useQuery({
    queryKey: ['admin', 'config-global', plataforma],
    queryFn: () => adminApi.obterConfigGlobal(plataforma),
    enabled: !!plataforma,
  })
}

// Atualizar configuracao
export function useUpdateConfigGlobal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      plataforma,
      configuracoes,
    }: {
      plataforma: string
      configuracoes: Record<string, unknown>
    }) => adminApi.atualizarConfigGlobal(plataforma, configuracoes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config-global', variables.plataforma] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'config-global'] })
    },
  })
}

// Testar configuracao
export function useTestarConfigGlobal() {
  return useMutation({
    mutationFn: (plataforma: string) => adminApi.testarConfigGlobal(plataforma),
  })
}
