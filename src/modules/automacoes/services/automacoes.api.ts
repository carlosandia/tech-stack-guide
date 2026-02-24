/**
 * AIDEV-NOTE: API service para o módulo de Automações (PRD-12)
 * CRUD de automações e consulta de logs via Supabase
 */

import { supabase } from '@/integrations/supabase/client'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'
import type { Automacao, CriarAutomacaoInput, LogAutomacao, Acao, Condicao } from '../schemas/automacoes.schema'

// =====================================================
// Automações CRUD
// =====================================================

export async function listarAutomacoes(): Promise<Automacao[]> {
  // AIDEV-NOTE: Seg — filtro organizacao_id obrigatório para isolamento multi-tenant
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await (supabase
    .from('automacoes') as any)
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []).map(mapAutomacao)
}

export async function obterAutomacao(id: string): Promise<Automacao> {
  // AIDEV-NOTE: Seg — validar ownership de tenant antes de retornar
  const organizacaoId = await getOrganizacaoId()
  const { data, error } = await (supabase
    .from('automacoes') as any)
    .select('*')
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .single()

  if (error) throw error
  return mapAutomacao(data)
}

// AIDEV-NOTE: Seg — limite de automações por tenant para prevenir resource exhaustion
const MAX_AUTOMACOES_POR_TENANT = 500

export async function criarAutomacao(input: CriarAutomacaoInput): Promise<Automacao> {
  const organizacaoId = await getOrganizacaoId()
  const usuarioId = await getUsuarioId()

  const { count, error: countError } = await (supabase
    .from('automacoes') as any)
    .select('id', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (countError) throw countError
  if ((count ?? 0) >= MAX_AUTOMACOES_POR_TENANT) {
    throw new Error(`Limite de ${MAX_AUTOMACOES_POR_TENANT} automações atingido`)
  }

  const { data, error } = await (supabase
    .from('automacoes') as any)
    .insert({
      organizacao_id: organizacaoId,
      nome: input.nome,
      descricao: input.descricao || null,
      trigger_tipo: input.trigger_tipo,
      trigger_config: input.trigger_config,
      condicoes: input.condicoes,
      acoes: input.acoes,
      criado_por: usuarioId,
      ativo: false,
    })
    .select()
    .single()

  if (error) throw error
  return mapAutomacao(data)
}

export async function atualizarAutomacao(
  id: string,
  payload: Partial<{
    nome: string
    descricao: string | null
    ativo: boolean
    trigger_tipo: string
    trigger_config: Record<string, unknown>
    condicoes: Condicao[]
    acoes: Acao[]
  }>
): Promise<Automacao> {
  // AIDEV-NOTE: Seg — validar ownership de tenant antes de atualizar
  const organizacaoId = await getOrganizacaoId()
  const updatePayload: Record<string, unknown> = { ...payload }
  if (payload.condicoes) {
    updatePayload.condicoes = payload.condicoes as unknown as Record<string, unknown>[]
  }
  if (payload.acoes) {
    updatePayload.acoes = payload.acoes as unknown as Record<string, unknown>[]
  }

  const { data, error } = await (supabase
    .from('automacoes') as any)
    .update(updatePayload)
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw error
  return mapAutomacao(data)
}

export async function excluirAutomacao(id: string): Promise<void> {
  // AIDEV-NOTE: Seg — validar ownership de tenant antes de excluir
  const organizacaoId = await getOrganizacaoId()
  const { error } = await (supabase
    .from('automacoes') as any)
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)

  if (error) throw error
}

// =====================================================
// Logs
// =====================================================

export async function listarLogs(
  automacaoId?: string,
  limit = 50,
  status?: string
): Promise<LogAutomacao[]> {
  // AIDEV-NOTE: Seg — filtro organizacao_id obrigatório para isolamento de logs
  const organizacaoId = await getOrganizacaoId()
  let query = (supabase
    .from('log_automacoes') as any)
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .order('criado_em', { ascending: false })
    .limit(limit)

  if (automacaoId) query = query.eq('automacao_id', automacaoId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) throw error
  return (data || []).map(mapLog)
}

// =====================================================
// Helpers
// =====================================================

function mapAutomacao(row: Record<string, unknown>): Automacao {
  return {
    id: row.id as string,
    organizacao_id: row.organizacao_id as string,
    nome: row.nome as string,
    descricao: row.descricao as string | null,
    ativo: row.ativo as boolean,
    trigger_tipo: row.trigger_tipo as string,
    trigger_config: (row.trigger_config || {}) as Record<string, unknown>,
    condicoes: (Array.isArray(row.condicoes) ? row.condicoes : []) as Condicao[],
    acoes: (Array.isArray(row.acoes) ? row.acoes : []) as Acao[],
    max_execucoes_hora: row.max_execucoes_hora as number,
    total_execucoes: row.total_execucoes as number,
    total_erros: row.total_erros as number,
    ultima_execucao_em: row.ultima_execucao_em as string | null,
    criado_por: row.criado_por as string | null,
    criado_em: row.criado_em as string,
    atualizado_em: row.atualizado_em as string,
    deletado_em: row.deletado_em as string | null,
  }
}

function mapLog(row: Record<string, unknown>): LogAutomacao {
  return {
    id: row.id as string,
    organizacao_id: row.organizacao_id as string,
    automacao_id: row.automacao_id as string,
    trigger_tipo: row.trigger_tipo as string,
    entidade_tipo: row.entidade_tipo as string | null,
    entidade_id: row.entidade_id as string | null,
    status: row.status as string,
    acoes_executadas: (Array.isArray(row.acoes_executadas) ? row.acoes_executadas : []) as unknown[],
    erro_mensagem: row.erro_mensagem as string | null,
    dados_trigger: row.dados_trigger as Record<string, unknown> | null,
    duracao_ms: row.duracao_ms as number | null,
    criado_em: row.criado_em as string,
  }
}
