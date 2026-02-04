import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type CriarOrganizacaoPayload } from '../services/admin.api'

/**
 * AIDEV-NOTE: React Query hooks para Organizacoes
 * Conforme PRD-14 - Gestao de Organizacoes
 */

// Listar organizacoes com filtros
export function useOrganizacoes(params?: {
  page?: number
  limit?: number
  busca?: string
  status?: string
  plano?: string
  segmento?: string
}) {
  return useQuery({
    queryKey: ['admin', 'organizacoes', params],
    queryFn: () => adminApi.listarOrganizacoes(params),
  })
}

// Obter detalhes de uma organizacao
export function useOrganizacao(id: string) {
  return useQuery({
    queryKey: ['admin', 'organizacao', id],
    queryFn: () => adminApi.obterOrganizacao(id),
    enabled: !!id,
  })
}

// Criar nova organizacao
export function useCreateOrganizacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CriarOrganizacaoPayload) => adminApi.criarOrganizacao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacoes'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'metricas'] })
    },
  })
}

// Atualizar organizacao
export function useUpdateOrganizacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.atualizarOrganizacao>[1] }) =>
      adminApi.atualizarOrganizacao(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacao', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacoes'] })
    },
  })
}

// Suspender organizacao
export function useSuspenderOrganizacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      adminApi.suspenderOrganizacao(id, motivo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacao', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacoes'] })
    },
  })
}

// Reativar organizacao
export function useReativarOrganizacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.reativarOrganizacao(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacao', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacoes'] })
    },
  })
}

// Impersonar organizacao
export function useImpersonarOrganizacao() {
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      adminApi.impersonarOrganizacao(id, motivo),
  })
}

// Listar usuarios de uma organizacao
export function useUsuariosOrganizacao(id: string) {
  return useQuery({
    queryKey: ['admin', 'organizacao', id, 'usuarios'],
    queryFn: () => adminApi.listarUsuariosOrganizacao(id),
    enabled: !!id,
  })
}

// Obter limites de uso de uma organizacao
export function useLimitesOrganizacao(id: string) {
  return useQuery({
    queryKey: ['admin', 'organizacao', id, 'limites'],
    queryFn: () => adminApi.obterLimitesOrganizacao(id),
    enabled: !!id,
  })
}

// Obter modulos de uma organizacao
export function useModulosOrganizacao(id: string) {
  return useQuery({
    queryKey: ['admin', 'organizacao', id, 'modulos'],
    queryFn: () => adminApi.obterModulosOrganizacao(id),
    enabled: !!id,
  })
}

// Atualizar modulos de uma organizacao
export function useAtualizarModulosOrganizacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      modulos,
    }: {
      id: string
      modulos: Array<{ modulo_id: string; ativo: boolean; ordem?: number }>
    }) => adminApi.atualizarModulosOrganizacao(id, modulos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizacao', variables.id, 'modulos'] })
    },
  })
}
