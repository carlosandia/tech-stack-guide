import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/admin.api'

/**
 * AIDEV-NOTE: React Query hooks para Planos
 * Conforme PRD-14 - Gestao de Planos
 */

// Listar todos os planos
export function usePlanos() {
  return useQuery({
    queryKey: ['admin', 'planos'],
    queryFn: () => adminApi.listarPlanos(),
  })
}

// Obter detalhes de um plano
export function usePlano(id: string) {
  return useQuery({
    queryKey: ['admin', 'plano', id],
    queryFn: () => adminApi.obterPlano(id),
    enabled: !!id,
  })
}

// Criar novo plano
export function useCreatePlano() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminApi.criarPlano,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'planos'] })
    },
  })
}

// Atualizar plano
export function useUpdatePlano() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.atualizarPlano>[1] }) =>
      adminApi.atualizarPlano(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plano', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'planos'] })
    },
  })
}

// Definir modulos de um plano
export function useDefinirModulosPlano() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      planoId,
      modulos,
    }: {
      planoId: string
      modulos: Array<{ modulo_id: string; configuracoes?: Record<string, unknown> }>
    }) => adminApi.definirModulosPlano(planoId, modulos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plano', variables.planoId] })
    },
  })
}

// Listar modulos disponiveis
export function useModulos() {
  return useQuery({
    queryKey: ['admin', 'modulos'],
    queryFn: () => adminApi.listarModulos(),
  })
}

// Excluir plano
export function useExcluirPlano() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminApi.excluirPlano,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'planos'] })
    },
  })
}
