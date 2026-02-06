/**
 * AIDEV-NOTE: React Query hooks para Gestão de Equipe
 * Conforme PRD-05 - Gestão de Equipe (Admin Only)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipeApi } from '../services/configuracoes.api'

// =====================================================
// EQUIPES
// =====================================================

export function useEquipes(params?: { busca?: string; ativa?: string }) {
  return useQuery({
    queryKey: ['equipes', params],
    queryFn: () => equipeApi.listarEquipes(params),
  })
}

export function useEquipe(id: string) {
  return useQuery({
    queryKey: ['equipes', id],
    queryFn: () => equipeApi.buscarEquipe(id),
    enabled: !!id,
  })
}

export function useCriarEquipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => equipeApi.criarEquipe(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useAtualizarEquipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      equipeApi.atualizarEquipe(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useExcluirEquipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipeApi.excluirEquipe(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

// Membros
export function useAdicionarMembro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ equipeId, payload }: { equipeId: string; payload: { usuario_id: string; papel?: 'lider' | 'membro' } }) =>
      equipeApi.adicionarMembro(equipeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useRemoverMembro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ equipeId, usuarioId }: { equipeId: string; usuarioId: string }) =>
      equipeApi.removerMembro(equipeId, usuarioId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

export function useAlterarPapelMembro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ equipeId, usuarioId, papel }: { equipeId: string; usuarioId: string; papel: 'lider' | 'membro' }) =>
      equipeApi.alterarPapelMembro(equipeId, usuarioId, papel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  })
}

// =====================================================
// USUARIOS
// =====================================================

export function useUsuarios(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => equipeApi.listarUsuarios(params),
  })
}

export function useConvidarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => equipeApi.convidarUsuario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useAtualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      equipeApi.atualizarUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useAlterarStatusUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; motivo?: string } }) =>
      equipeApi.alterarStatusUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useReenviarConvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipeApi.reenviarConvite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

// =====================================================
// PERFIS DE PERMISSÃO
// =====================================================

export function usePerfis() {
  return useQuery({
    queryKey: ['perfis-permissao'],
    queryFn: () => equipeApi.listarPerfis(),
  })
}

export function useCriarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => equipeApi.criarPerfil(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] }),
  })
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      equipeApi.atualizarPerfil(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] }),
  })
}

export function useExcluirPerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipeApi.excluirPerfil(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['perfis-permissao'] }),
  })
}
