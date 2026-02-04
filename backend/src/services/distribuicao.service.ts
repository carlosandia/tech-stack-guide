/**
 * AIDEV-NOTE: Service para Distribuicao de Oportunidades
 * Conforme PRD-07 - Distribuicao Automatica/Manual
 *
 * Modos: manual (admin atribui) ou rodizio (automatico round-robin)
 * SLA: tempo limite para contato, com redistribuicao automatica
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  ConfiguracaoDistribuicao,
  AtualizarDistribuicaoPayload,
  HistoricoDistribuicao,
} from '../schemas/distribuicao'

const supabase = supabaseAdmin

// =====================================================
// Obter Configuracao de Distribuicao
// =====================================================

export async function obterConfiguracao(
  organizacaoId: string,
  funilId: string
): Promise<ConfiguracaoDistribuicao | null> {
  const { data, error } = await supabase
    .from('configuracoes_distribuicao')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao obter configuracao: ${error.message}`)
  }

  return data as ConfiguracaoDistribuicao
}

// =====================================================
// Criar/Atualizar Configuracao de Distribuicao
// =====================================================

export async function atualizarConfiguracao(
  organizacaoId: string,
  funilId: string,
  payload: AtualizarDistribuicaoPayload
): Promise<ConfiguracaoDistribuicao> {
  // Verificar se ja existe
  const existente = await obterConfiguracao(organizacaoId, funilId)

  if (existente) {
    const { data, error } = await supabase
      .from('configuracoes_distribuicao')
      .update({
        ...payload,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', existente.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar configuracao: ${error.message}`)
    }

    return data as ConfiguracaoDistribuicao
  }

  // Criar nova configuracao
  const { data, error } = await supabase
    .from('configuracoes_distribuicao')
    .insert({
      organizacao_id: organizacaoId,
      funil_id: funilId,
      modo: payload.modo || 'manual',
      ...payload,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar configuracao: ${error.message}`)
  }

  return data as ConfiguracaoDistribuicao
}

// =====================================================
// Distribuir Oportunidade (Round Robin)
// =====================================================

export async function distribuirOportunidade(
  organizacaoId: string,
  oportunidadeId: string
): Promise<string | null> {
  // Buscar oportunidade
  const { data: oportunidade, error: opError } = await supabase
    .from('oportunidades')
    .select('funil_id, usuario_responsavel_id')
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .single()

  if (opError || !oportunidade) {
    throw new Error('Oportunidade nao encontrada')
  }

  // Ja tem responsavel?
  if (oportunidade.usuario_responsavel_id) {
    return oportunidade.usuario_responsavel_id
  }

  // Buscar configuracao de distribuicao
  const config = await obterConfiguracao(organizacaoId, oportunidade.funil_id)

  if (!config || config.modo === 'manual') {
    // Distribuicao manual, nao faz nada
    return null
  }

  // Verificar horario permitido
  if (config.horario_especifico) {
    const agora = new Date()
    const horaAtual = agora.getHours() * 100 + agora.getMinutes()
    const diaAtual = agora.getDay() // 0 = domingo

    // Verificar dia da semana
    if (config.dias_semana && !config.dias_semana.includes(diaAtual)) {
      if (config.fallback_manual) return null
      throw new Error('Distribuicao nao permitida neste dia')
    }

    // Verificar horario
    if (config.horario_inicio && config.horario_fim) {
      const [inicioH, inicioM] = config.horario_inicio.split(':').map(Number)
      const [fimH, fimM] = config.horario_fim.split(':').map(Number)
      const inicio = inicioH * 100 + inicioM
      const fim = fimH * 100 + fimM

      if (horaAtual < inicio || horaAtual > fim) {
        if (config.fallback_manual) return null
        throw new Error('Distribuicao nao permitida neste horario')
      }
    }
  }

  // Buscar membros ativos do funil
  const { data: membros } = await supabase
    .from('funis_membros')
    .select('usuario_id')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', oportunidade.funil_id)
    .eq('ativo', true)

  if (!membros || membros.length === 0) {
    if (config.fallback_manual) return null
    throw new Error('Nao ha membros disponiveis para distribuicao')
  }

  // Se pular inativos, filtrar usuarios ativos
  let usuariosDisponiveis = membros.map((m) => m.usuario_id)

  if (config.pular_inativos) {
    const { data: usuariosAtivos } = await supabase
      .from('usuarios')
      .select('id')
      .in('id', usuariosDisponiveis)
      .eq('ativo', true)

    usuariosDisponiveis = (usuariosAtivos || []).map((u) => u.id)
  }

  if (usuariosDisponiveis.length === 0) {
    if (config.fallback_manual) return null
    throw new Error('Nao ha usuarios disponiveis para distribuicao')
  }

  // Round Robin: buscar ultimo usuario que recebeu oportunidade
  const { data: ultimaDistribuicao } = await supabase
    .from('historico_distribuicao')
    .select('usuario_destino_id')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', oportunidade.funil_id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  let proximoUsuarioId: string

  if (ultimaDistribuicao) {
    const indexUltimo = usuariosDisponiveis.indexOf(ultimaDistribuicao.usuario_destino_id)
    const proximoIndex = (indexUltimo + 1) % usuariosDisponiveis.length
    proximoUsuarioId = usuariosDisponiveis[proximoIndex]
  } else {
    proximoUsuarioId = usuariosDisponiveis[0]
  }

  // Atribuir oportunidade
  const { error: updateError } = await supabase
    .from('oportunidades')
    .update({
      usuario_responsavel_id: proximoUsuarioId,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', oportunidadeId)

  if (updateError) {
    throw new Error(`Erro ao atribuir oportunidade: ${updateError.message}`)
  }

  // Registrar historico
  await registrarHistorico(organizacaoId, {
    oportunidade_id: oportunidadeId,
    funil_id: oportunidade.funil_id,
    usuario_origem_id: null,
    usuario_destino_id: proximoUsuarioId,
    motivo: 'distribuicao_automatica',
  })

  return proximoUsuarioId
}

// =====================================================
// Processar SLA (Job Periodico)
// =====================================================

export async function processarSla(organizacaoId: string): Promise<number> {
  // Buscar funis com SLA ativo
  const { data: configs } = await supabase
    .from('configuracoes_distribuicao')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('sla_ativo', true)

  if (!configs || configs.length === 0) {
    return 0
  }

  let redistribuidas = 0

  for (const config of configs) {
    // Buscar oportunidades que excederam SLA
    const tempoLimite = new Date()
    tempoLimite.setMinutes(tempoLimite.getMinutes() - (config.sla_tempo_minutos || 60))

    const { data: oportunidadesExcedidas } = await supabase
      .from('oportunidades')
      .select('id, usuario_responsavel_id')
      .eq('organizacao_id', organizacaoId)
      .eq('funil_id', config.funil_id)
      .not('usuario_responsavel_id', 'is', null)
      .is('fechado_em', null)
      .is('deletado_em', null)
      .lt('atualizado_em', tempoLimite.toISOString())

    if (!oportunidadesExcedidas) continue

    for (const op of oportunidadesExcedidas) {
      // Verificar quantas redistribuicoes ja teve
      const { count } = await supabase
        .from('historico_distribuicao')
        .select('*', { count: 'exact', head: true })
        .eq('oportunidade_id', op.id)
        .eq('motivo', 'sla_excedido')

      if (count && count >= (config.sla_max_redistribuicoes || 3)) {
        // Atingiu limite, aplicar acao
        if (config.sla_acao_limite === 'desatribuir') {
          await supabase.from('oportunidades').update({ usuario_responsavel_id: null }).eq('id', op.id)
        } else if (config.sla_acao_limite === 'retornar_admin') {
          // Buscar admin da organizacao
          const { data: admin } = await supabase
            .from('usuarios')
            .select('id')
            .eq('organizacao_id', organizacaoId)
            .eq('papel', 'admin')
            .limit(1)
            .single()

          if (admin) {
            await supabase
              .from('oportunidades')
              .update({ usuario_responsavel_id: admin.id })
              .eq('id', op.id)
          }
        }
        // 'manter_ultimo' nao faz nada
        continue
      }

      // Redistribuir
      const usuarioAnterior = op.usuario_responsavel_id

      // Limpar responsavel e redistribuir
      await supabase.from('oportunidades').update({ usuario_responsavel_id: null }).eq('id', op.id)

      const novoResponsavel = await distribuirOportunidade(organizacaoId, op.id)

      if (novoResponsavel && novoResponsavel !== usuarioAnterior) {
        await registrarHistorico(organizacaoId, {
          oportunidade_id: op.id,
          funil_id: config.funil_id,
          usuario_origem_id: usuarioAnterior,
          usuario_destino_id: novoResponsavel,
          motivo: 'sla_excedido',
        })
        redistribuidas++
      }
    }
  }

  return redistribuidas
}

// =====================================================
// Registrar Historico de Distribuicao
// =====================================================

async function registrarHistorico(
  organizacaoId: string,
  dados: {
    oportunidade_id: string
    funil_id: string
    usuario_origem_id: string | null
    usuario_destino_id: string
    motivo: string
  }
): Promise<void> {
  await supabase.from('historico_distribuicao').insert({
    organizacao_id: organizacaoId,
    ...dados,
  })
}

// =====================================================
// Listar Historico de Distribuicao
// =====================================================

export async function listarHistorico(
  organizacaoId: string,
  oportunidadeId?: string,
  funilId?: string
): Promise<HistoricoDistribuicao[]> {
  let query = supabase
    .from('historico_distribuicao')
    .select(
      `
      *,
      usuario_origem:usuario_origem_id (id, nome),
      usuario_destino:usuario_destino_id (id, nome)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .order('criado_em', { ascending: false })

  if (oportunidadeId) {
    query = query.eq('oportunidade_id', oportunidadeId)
  }

  if (funilId) {
    query = query.eq('funil_id', funilId)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    throw new Error(`Erro ao listar historico: ${error.message}`)
  }

  return data as HistoricoDistribuicao[]
}

export default {
  obterConfiguracao,
  atualizarConfiguracao,
  distribuirOportunidade,
  processarSla,
  listarHistorico,
}
