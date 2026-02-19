/**
 * AIDEV-NOTE: Service para CRUD de filtros salvos do Kanban
 * Tabela: preferencias_filtros_kanban
 */

import { supabase } from '@/lib/supabase'
import type { FiltrosKanban } from '../components/toolbar/FiltrosPopover'

export interface FiltroSalvo {
  id: string
  nome: string
  filtros: FiltrosKanban
  padrao: boolean
  criado_em: string
}

export async function listarFiltrosSalvos(): Promise<FiltroSalvo[]> {
  const { data, error } = await supabase
    .from('preferencias_filtros_kanban')
    .select('id, nome, filtros, padrao, criado_em')
    .order('criado_em', { ascending: true })

  if (error) {
    console.error('[filtros-salvos] Erro ao listar:', error)
    return []
  }

  return (data ?? []) as unknown as FiltroSalvo[]
}

export async function salvarFiltro(
  usuarioId: string,
  organizacaoId: string,
  nome: string,
  filtros: FiltrosKanban
): Promise<FiltroSalvo | null> {
  const { data, error } = await supabase
    .from('preferencias_filtros_kanban')
    .upsert(
      { usuario_id: usuarioId, organizacao_id: organizacaoId, nome, filtros: filtros as any },
      { onConflict: 'usuario_id,organizacao_id,nome' }
    )
    .select('id, nome, filtros, padrao, criado_em')
    .single()

  if (error) {
    console.error('[filtros-salvos] Erro ao salvar:', error)
    throw error
  }

  return data as unknown as FiltroSalvo
}

export async function excluirFiltro(id: string): Promise<void> {
  const { error } = await supabase
    .from('preferencias_filtros_kanban')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[filtros-salvos] Erro ao excluir:', error)
    throw error
  }
}

export async function definirFiltroPadrao(id: string, organizacaoId: string, usuarioId: string): Promise<void> {
  // Remove padrao de todos
  await supabase
    .from('preferencias_filtros_kanban')
    .update({ padrao: false })
    .eq('usuario_id', usuarioId)
    .eq('organizacao_id', organizacaoId)

  // Define o selecionado como padrao
  const { error } = await supabase
    .from('preferencias_filtros_kanban')
    .update({ padrao: true })
    .eq('id', id)

  if (error) {
    console.error('[filtros-salvos] Erro ao definir padrão:', error)
    throw error
  }
}
