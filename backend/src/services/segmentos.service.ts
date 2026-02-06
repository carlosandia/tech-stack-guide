/**
 * AIDEV-NOTE: Service para Segmentos de Contatos
 * Conforme PRD-06 - Sistema de Segmentacao
 * Segmentos sao tags coloridas para categorizar contatos (pessoas)
 */

import { supabaseAdmin } from '../config/supabase.js'

const supabase = supabaseAdmin

// =====================================================
// Listar Segmentos com contagem de contatos
// =====================================================

export async function listarSegmentos(organizacaoId: string) {
  const { data, error } = await supabase
    .from('segmentos')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('nome', { ascending: true })

  if (error) throw new Error(`Erro ao listar segmentos: ${error.message}`)

  // Buscar contagem de contatos por segmento
  const segmentosComContagem = await Promise.all(
    (data || []).map(async (segmento) => {
      const { count } = await supabase
        .from('contatos_segmentos')
        .select('*', { count: 'exact', head: true })
        .eq('segmento_id', segmento.id)
        .eq('organizacao_id', organizacaoId)

      return { ...segmento, total_contatos: count || 0 }
    })
  )

  return { segmentos: segmentosComContagem, total: segmentosComContagem.length }
}

// =====================================================
// Criar Segmento
// =====================================================

export async function criarSegmento(
  organizacaoId: string,
  usuarioId: string,
  payload: { nome: string; cor: string; descricao?: string }
) {
  const { data, error } = await supabase
    .from('segmentos')
    .insert({
      organizacao_id: organizacaoId,
      nome: payload.nome,
      cor: payload.cor,
      descricao: payload.descricao || null,
      criado_por: usuarioId,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar segmento: ${error.message}`)
  return data
}

// =====================================================
// Atualizar Segmento
// =====================================================

export async function atualizarSegmento(
  id: string,
  organizacaoId: string,
  payload: { nome?: string; cor?: string; descricao?: string | null }
) {
  const { data, error } = await supabase
    .from('segmentos')
    .update({ ...payload, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar segmento: ${error.message}`)
  return data
}

// =====================================================
// Excluir Segmento (Soft Delete)
// =====================================================

export async function excluirSegmento(id: string, organizacaoId: string) {
  // Remove vinculos primeiro
  await supabase
    .from('contatos_segmentos')
    .delete()
    .eq('segmento_id', id)
    .eq('organizacao_id', organizacaoId)

  const { error } = await supabase
    .from('segmentos')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('organizacao_id', organizacaoId)

  if (error) throw new Error(`Erro ao excluir segmento: ${error.message}`)
}

// =====================================================
// Vincular segmentos a contato
// =====================================================

export async function vincularSegmentos(
  contatoId: string,
  organizacaoId: string,
  segmentoIds: string[]
) {
  // Remove vinculos antigos
  await supabase
    .from('contatos_segmentos')
    .delete()
    .eq('contato_id', contatoId)
    .eq('organizacao_id', organizacaoId)

  if (segmentoIds.length === 0) return

  const inserts = segmentoIds.map((segmentoId) => ({
    contato_id: contatoId,
    segmento_id: segmentoId,
    organizacao_id: organizacaoId,
  }))

  const { error } = await supabase.from('contatos_segmentos').insert(inserts)
  if (error) throw new Error(`Erro ao vincular segmentos: ${error.message}`)
}

// =====================================================
// Desvincular segmento de contato
// =====================================================

export async function desvincularSegmento(
  contatoId: string,
  organizacaoId: string,
  segmentoId: string
) {
  const { error } = await supabase
    .from('contatos_segmentos')
    .delete()
    .eq('contato_id', contatoId)
    .eq('segmento_id', segmentoId)
    .eq('organizacao_id', organizacaoId)

  if (error) throw new Error(`Erro ao desvincular segmento: ${error.message}`)
}

// =====================================================
// Segmentar em lote
// =====================================================

export async function segmentarLote(
  organizacaoId: string,
  payload: { ids: string[]; adicionar: string[]; remover: string[] }
) {
  const { ids, adicionar, remover } = payload

  // Remover segmentos
  if (remover.length > 0) {
    for (const segmentoId of remover) {
      await supabase
        .from('contatos_segmentos')
        .delete()
        .in('contato_id', ids)
        .eq('segmento_id', segmentoId)
        .eq('organizacao_id', organizacaoId)
    }
  }

  // Adicionar segmentos (ignorar duplicatas)
  if (adicionar.length > 0) {
    for (const contatoId of ids) {
      for (const segmentoId of adicionar) {
        // Verifica se ja existe
        const { data: existente } = await supabase
          .from('contatos_segmentos')
          .select('id')
          .eq('contato_id', contatoId)
          .eq('segmento_id', segmentoId)
          .eq('organizacao_id', organizacaoId)
          .maybeSingle()

        if (!existente) {
          await supabase.from('contatos_segmentos').insert({
            contato_id: contatoId,
            segmento_id: segmentoId,
            organizacao_id: organizacaoId,
          })
        }
      }
    }
  }

  return { sucesso: true, total: ids.length }
}

export default {
  listarSegmentos,
  criarSegmento,
  atualizarSegmento,
  excluirSegmento,
  vincularSegmentos,
  desvincularSegmento,
  segmentarLote,
}
