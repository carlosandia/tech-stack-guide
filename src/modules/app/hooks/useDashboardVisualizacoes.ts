/**
 * AIDEV-NOTE: Hook CRUD para visualizações salvas do dashboard.
 * Persiste filtros + config de exibição por usuário/organização.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
import { toast } from 'sonner'
import type { Periodo } from '../types/relatorio.types'
import type { DashboardDisplayConfig } from './useDashboardDisplay'

export interface VisualizacaoFiltros {
  periodo?: Periodo | null
  funil_id?: string | null
  data_inicio?: string | null
  data_fim?: string | null
}

export interface VisualizacaoDashboard {
  id: string
  nome: string
  filtros: VisualizacaoFiltros
  config_exibicao: Partial<DashboardDisplayConfig>
  criado_em: string
}

const QUERY_KEY = ['visualizacoes_dashboard']

export function useDashboardVisualizacoes() {
  const queryClient = useQueryClient()

  const { data: visualizacoes = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('visualizacoes_dashboard') as any)
        .select('id, nome, filtros, config_exibicao, criado_em')
        .order('criado_em', { ascending: false })

      if (error) throw error
      return (data || []) as VisualizacaoDashboard[]
    },
  })

  const salvarMutation = useMutation({
    mutationFn: async (params: {
      nome: string
      filtros: VisualizacaoFiltros
      config_exibicao: Partial<DashboardDisplayConfig>
    }) => {
      const [orgId, userId] = await Promise.all([getOrganizacaoId(), getUsuarioId()])
      const { error } = await (supabase
        .from('visualizacoes_dashboard') as any)
        .insert({
          usuario_id: userId,
          organizacao_id: orgId,
          nome: params.nome,
          filtros: params.filtros,
          config_exibicao: params.config_exibicao,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Visualização salva com sucesso')
    },
    onError: () => {
      toast.error('Erro ao salvar visualização')
    },
  })

  const editarMutation = useMutation({
    mutationFn: async (params: {
      id: string
      nome?: string
      filtros?: VisualizacaoFiltros
      config_exibicao?: Partial<DashboardDisplayConfig>
    }) => {
      const updates: Record<string, unknown> = {}
      if (params.nome !== undefined) updates.nome = params.nome
      if (params.filtros !== undefined) updates.filtros = params.filtros
      if (params.config_exibicao !== undefined) updates.config_exibicao = params.config_exibicao
      const { error } = await (supabase
        .from('visualizacoes_dashboard') as any)
        .update(updates)
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Visualização atualizada')
    },
    onError: () => {
      toast.error('Erro ao atualizar visualização')
    },
  })

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('visualizacoes_dashboard') as any)
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Visualização excluída')
    },
    onError: () => {
      toast.error('Erro ao excluir visualização')
    },
  })

  return {
    visualizacoes,
    isLoading,
    salvar: salvarMutation.mutate,
    editar: editarMutation.mutate,
    excluir: excluirMutation.mutate,
    isSaving: salvarMutation.isPending,
    isEditing: editarMutation.isPending,
  }
}
