/**
 * AIDEV-NOTE: Service para Pre-Oportunidades
 * Conforme PRD-07 - Modulo de Negocios (RF-11)
 *
 * Pre-oportunidades sao leads vindos do WhatsApp que precisam
 * de triagem antes de virar uma oportunidade real.
 * Aparecem na coluna "Solicitacoes" do Kanban.
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  PreOportunidade,
  AceitarPreOportunidadePayload,
  RejeitarPreOportunidadePayload,
  ListaPreOportunidadesResponse,
  ListarPreOportunidadesQuery,
  CriarPreOportunidadeWebhookPayload,
  PreOportunidadeCard,
} from '../schemas/pre-oportunidades'
import * as oportunidadesService from './oportunidades.service'
import * as etapasFunilService from './etapas-funil.service'

const supabase = supabaseAdmin

// =====================================================
// Listar Pre-Oportunidades
// =====================================================

export async function listarPreOportunidades(
  organizacaoId: string,
  query: ListarPreOportunidadesQuery
): Promise<ListaPreOportunidadesResponse> {
  let queryBuilder = supabase
    .from('pre_oportunidades')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  // Filtros
  if (query.funil_destino_id) {
    queryBuilder = queryBuilder.eq('funil_destino_id', query.funil_destino_id)
  }

  if (query.status) {
    queryBuilder = queryBuilder.eq('status', query.status)
  }

  if (query.busca) {
    queryBuilder = queryBuilder.or(
      `phone_number.ilike.%${query.busca}%,phone_name.ilike.%${query.busca}%`
    )
  }

  // Ordenacao
  const ascending = query.ordem === 'asc'
  queryBuilder = queryBuilder.order(query.ordenar_por, { ascending })

  // Paginacao
  const offset = (query.page - 1) * query.per_page
  queryBuilder = queryBuilder.range(offset, offset + query.per_page - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    throw new Error(`Erro ao listar pre-oportunidades: ${error.message}`)
  }

  // Contar pendentes
  const { count: totalPendentes } = await supabase
    .from('pre_oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'pendente')
    .is('deletado_em', null)

  return {
    pre_oportunidades: data as PreOportunidade[],
    total: count || 0,
    total_pendentes: totalPendentes || 0,
    page: query.page,
    per_page: query.per_page,
    total_pages: Math.ceil((count || 0) / query.per_page),
  }
}

// =====================================================
// Buscar Pre-Oportunidade por ID
// =====================================================

export async function buscarPreOportunidade(
  organizacaoId: string,
  preOportunidadeId: string
): Promise<PreOportunidade | null> {
  const { data, error } = await supabase
    .from('pre_oportunidades')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', preOportunidadeId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar pre-oportunidade: ${error.message}`)
  }

  return data as PreOportunidade
}

// =====================================================
// Listar Cards para Coluna Solicitacoes
// =====================================================

export async function listarCards(
  organizacaoId: string,
  funilId: string
): Promise<PreOportunidadeCard[]> {
  const { data, error } = await supabase
    .from('pre_oportunidades')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_destino_id', funilId)
    .eq('status', 'pendente')
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar cards: ${error.message}`)
  }

  const agora = new Date()

  return (data || []).map((preOp) => {
    const criadoEm = new Date(preOp.criado_em)
    const tempoEsperaMinutos = Math.floor((agora.getTime() - criadoEm.getTime()) / (1000 * 60))

    return {
      id: preOp.id,
      phone_number: preOp.phone_number,
      phone_name: preOp.phone_name,
      profile_picture_url: preOp.profile_picture_url,
      primeira_mensagem: preOp.primeira_mensagem,
      ultima_mensagem: preOp.ultima_mensagem,
      total_mensagens: preOp.total_mensagens,
      criado_em: preOp.criado_em,
      ultima_mensagem_em: preOp.ultima_mensagem_em,
      tempo_espera_minutos: tempoEsperaMinutos,
    } as PreOportunidadeCard
  })
}

// =====================================================
// Aceitar Pre-Oportunidade (Criar Oportunidade)
// =====================================================

export async function aceitarPreOportunidade(
  organizacaoId: string,
  preOportunidadeId: string,
  payload: AceitarPreOportunidadePayload,
  usuarioId: string
): Promise<{ oportunidade_id: string }> {
  // Buscar pre-oportunidade
  const preOp = await buscarPreOportunidade(organizacaoId, preOportunidadeId)
  if (!preOp) {
    throw new Error('Pre-oportunidade nao encontrada')
  }

  if (preOp.status !== 'pendente') {
    throw new Error('Pre-oportunidade ja foi processada')
  }

  // Buscar ou criar contato
  let contatoId = payload.contato_existente_id

  if (!contatoId) {
    // Verificar se existe contato com este telefone
    const { data: contatoExistente } = await supabase
      .from('contatos')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('telefone', preOp.phone_number)
      .is('deletado_em', null)
      .single()

    if (contatoExistente) {
      contatoId = contatoExistente.id
    } else {
      // Criar novo contato
      const nomeContato =
        payload.contato?.nome || preOp.phone_name || `Contato ${preOp.phone_number}`

      const { data: novoContato, error: contatoError } = await supabase
        .from('contatos')
        .insert({
          organizacao_id: organizacaoId,
          tipo: 'pessoa',
          nome: nomeContato,
          email: payload.contato?.email,
          telefone: preOp.phone_number,
          origem: 'whatsapp',
        })
        .select()
        .single()

      if (contatoError) {
        throw new Error(`Erro ao criar contato: ${contatoError.message}`)
      }

      contatoId = novoContato.id
    }
  }

  // Buscar etapa de entrada
  let etapaId = payload.etapa_id
  if (!etapaId) {
    const etapaEntrada = await etapasFunilService.buscarEtapaEntrada(
      organizacaoId,
      preOp.funil_destino_id
    )
    if (etapaEntrada) {
      etapaId = etapaEntrada.id
    }
  }

  // Criar oportunidade
  const tituloOportunidade =
    payload.titulo || preOp.phone_name || `Oportunidade ${preOp.phone_number}`

  const oportunidade = await oportunidadesService.criarOportunidade(
    organizacaoId,
    {
      funil_id: preOp.funil_destino_id,
      etapa_id: etapaId,
      contato_id: contatoId,
      titulo: tituloOportunidade,
      valor: payload.valor,
      usuario_responsavel_id: payload.usuario_responsavel_id,
      observacoes: payload.observacoes,
    },
    usuarioId
  )

  // Atualizar pre-oportunidade
  const { error: updateError } = await supabase
    .from('pre_oportunidades')
    .update({
      status: 'aceito',
      oportunidade_id: oportunidade.id,
      processado_por: usuarioId,
      processado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', preOportunidadeId)

  if (updateError) {
    throw new Error(`Erro ao atualizar pre-oportunidade: ${updateError.message}`)
  }

  return { oportunidade_id: oportunidade.id }
}

// =====================================================
// Rejeitar Pre-Oportunidade
// =====================================================

export async function rejeitarPreOportunidade(
  organizacaoId: string,
  preOportunidadeId: string,
  payload: RejeitarPreOportunidadePayload,
  usuarioId: string
): Promise<void> {
  const preOp = await buscarPreOportunidade(organizacaoId, preOportunidadeId)
  if (!preOp) {
    throw new Error('Pre-oportunidade nao encontrada')
  }

  if (preOp.status !== 'pendente') {
    throw new Error('Pre-oportunidade ja foi processada')
  }

  const { error } = await supabase
    .from('pre_oportunidades')
    .update({
      status: 'rejeitado',
      motivo_rejeicao: payload.motivo,
      processado_por: usuarioId,
      processado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', preOportunidadeId)

  if (error) {
    throw new Error(`Erro ao rejeitar pre-oportunidade: ${error.message}`)
  }
}

// =====================================================
// Criar Pre-Oportunidade (Webhook WhatsApp)
// =====================================================

export async function criarPreOportunidade(
  organizacaoId: string,
  payload: CriarPreOportunidadeWebhookPayload
): Promise<PreOportunidade> {
  // Verificar se ja existe pre-oportunidade pendente para este telefone/funil
  const { data: existente } = await supabase
    .from('pre_oportunidades')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('phone_number', payload.phone_number)
    .eq('funil_destino_id', payload.funil_destino_id)
    .eq('status', 'pendente')
    .is('deletado_em', null)
    .single()

  if (existente) {
    // Atualizar com nova mensagem
    const { data: atualizado, error: updateError } = await supabase
      .from('pre_oportunidades')
      .update({
        ultima_mensagem: payload.mensagem,
        ultima_mensagem_em: payload.mensagem_timestamp,
        total_mensagens: existente.total_mensagens + 1,
        phone_name: payload.phone_name || existente.phone_name,
        profile_picture_url: payload.profile_picture_url || existente.profile_picture_url,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', existente.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erro ao atualizar pre-oportunidade: ${updateError.message}`)
    }

    return atualizado as PreOportunidade
  }

  // Criar nova pre-oportunidade
  const { data, error } = await supabase
    .from('pre_oportunidades')
    .insert({
      organizacao_id: organizacaoId,
      integracao_id: payload.integracao_id,
      funil_destino_id: payload.funil_destino_id,
      phone_number: payload.phone_number,
      phone_name: payload.phone_name,
      profile_picture_url: payload.profile_picture_url,
      primeira_mensagem: payload.mensagem,
      primeira_mensagem_em: payload.mensagem_timestamp,
      ultima_mensagem: payload.mensagem,
      ultima_mensagem_em: payload.mensagem_timestamp,
      total_mensagens: 1,
      status: 'pendente',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar pre-oportunidade: ${error.message}`)
  }

  return data as PreOportunidade
}

// =====================================================
// Contar Pre-Oportunidades Pendentes
// =====================================================

export async function contarPendentes(
  organizacaoId: string,
  funilId?: string
): Promise<number> {
  let query = supabase
    .from('pre_oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'pendente')
    .is('deletado_em', null)

  if (funilId) {
    query = query.eq('funil_destino_id', funilId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Erro ao contar pendentes: ${error.message}`)
  }

  return count || 0
}

export default {
  listarPreOportunidades,
  buscarPreOportunidade,
  listarCards,
  aceitarPreOportunidade,
  rejeitarPreOportunidade,
  criarPreOportunidade,
  contarPendentes,
}
