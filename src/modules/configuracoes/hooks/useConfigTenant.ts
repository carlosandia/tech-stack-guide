/**
 * AIDEV-NOTE: Hooks React Query para Configurações do Tenant
 * Conforme PRD-05 - Configurações Gerais
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { configTenantApi } from '../services/configuracoes.api'

const KEY = ['config-tenant'] as const

export function useConfigTenant() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => configTenantApi.buscar(),
  })
}

export function useAtualizarConfigTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => configTenantApi.atualizar(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Configurações atualizadas com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações')
    },
  })
}
