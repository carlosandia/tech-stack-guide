/**
 * AIDEV-NOTE: Service para Motivos de Resultado
 * Conforme PRD-05 - Motivos de Ganho e Perda
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  MotivoResultado,
  CriarMotivoPayload,
  AtualizarMotivoPayload,
  ListaMotivosResponse,
  TipoMotivo,
} from '../schemas/motivos'

// =====================================================
// Listar Motivos
// =====================================================

export async function listarMotivos(
  organizacaoId: string,
  tipo?: TipoMotivo
): Promise<ListaMotivosResponse> {
  let query = supabase
    .from('motivos_resultado')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, error, count } = await query.order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar motivos: ${error.message}`)
  }

  return {
    motivos: data as MotivoResultado[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Motivo por ID
// =====================================================

export async function buscarMotivo(
  organizacaoId: string,
  motivoId: string
): Promise<MotivoResultado | null> {
  const { data, error } = await supabase
    .from('motivos_resultado')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', motivoId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar motivo: ${error.message}`)
  }

  return data as MotivoResultado
}

// =====================================================
// Criar Motivo
// =====================================================

export async function criarMotivo(
  organizacaoId: string,
  payload: CriarMotivoPayload,
  criadoPor?: string
): Promise<MotivoResultado> {
  // Buscar proxima ordem
  const { data: ultimoMotivo } = await supabase
    .from('motivos_resultado')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .eq('tipo', payload.tipo)
    .is('deletado_em', null)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = ultimoMotivo ? ultimoMotivo.ordem + 1 : 0

  const { data, error } = await supabase
    .from('motivos_resultado')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      ordem: novaOrdem,
      padrao: false,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar motivo: ${error.message}`)
  }

  return data as MotivoResultado
}

// =====================================================
// Atualizar Motivo
// =====================================================

export async function atualizarMotivo(
  organizacaoId: string,
  motivoId: string,
  payload: AtualizarMotivoPayload
): Promise<MotivoResultado> {
  // Verificar se motivo existe e nao e do sistema
  const motivoExistente = await buscarMotivo(organizacaoId, motivoId)

  if (!motivoExistente) {
    throw new Error('Motivo nao encontrado')
  }

  if (motivoExistente.padrao) {
    throw new Error('Motivos do sistema nao podem ser alterados')
  }

  const { data, error } = await supabase
    .from('motivos_resultado')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', motivoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar motivo: ${error.message}`)
  }

  return data as MotivoResultado
}

// =====================================================
// Excluir Motivo (Soft Delete)
// =====================================================

export async function excluirMotivo(
  organizacaoId: string,
  motivoId: string
): Promise<void> {
  // Verificar se motivo existe e nao e do sistema
  const motivoExistente = await buscarMotivo(organizacaoId, motivoId)

  if (!motivoExistente) {
    throw new Error('Motivo nao encontrado')
  }

  if (motivoExistente.padrao) {
    throw new Error('Motivos do sistema nao podem ser excluidos')
  }

  const { error } = await supabase
    .from('motivos_resultado')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', motivoId)

  if (error) {
    throw new Error(`Erro ao excluir motivo: ${error.message}`)
  }
}

// =====================================================
// Reordenar Motivos
// =====================================================

export async function reordenarMotivos(
  organizacaoId: string,
  tipo: TipoMotivo,
  ordens: Array<{ id: string; ordem: number }>
): Promise<void> {
  const updates = ordens.map(({ id, ordem }) =>
    supabase
      .from('motivos_resultado')
      .update({ ordem, atualizado_em: new Date().toISOString() })
      .eq('organizacao_id', organizacaoId)
      .eq('id', id)
      .eq('tipo', tipo)
  )

  const results = await Promise.all(updates)

  const erros = results.filter((r: { error: unknown }) => r.error)
  if (erros.length > 0) {
    throw new Error('Erro ao reordenar motivos')
  }
}

export default {
  listarMotivos,
  buscarMotivo,
  criarMotivo,
  atualizarMotivo,
  excluirMotivo,
  reordenarMotivos,
}
