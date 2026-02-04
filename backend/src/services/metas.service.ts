/**
 * AIDEV-NOTE: Service para Metas Hierarquicas
 * Conforme PRD-05 - Sistema de Metas
 *
 * Hierarquia: Empresa → Equipe → Individual
 * Suporta distribuicao automatica e manual
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  Meta,
  MetaComProgresso,
  MetaDetalhada,
  CriarMetaPayload,
  AtualizarMetaPayload,
  DistribuirMetaPayload,
  DistribuicaoItem,
  ListaMetasResponse,
  MetasEmpresaResponse,
  MetasEquipeResponse,
  ProgressoGeral,
  RankingResponse,
  MinhasMetasResponse,
  TipoMeta,
  Metrica,
  PeriodoMeta,
} from '../schemas/metas'

// =====================================================
// Listar Metas
// =====================================================

export async function listarMetas(
  organizacaoId: string,
  filtros?: {
    tipo?: TipoMeta
    metrica?: Metrica
    periodo?: PeriodoMeta
    equipeId?: string
    usuarioId?: string
    ativa?: boolean
  }
): Promise<ListaMetasResponse> {
  const { tipo, metrica, periodo, equipeId, usuarioId, ativa } = filtros || {}

  let query = supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao),
      equipe:equipes(id, nome),
      usuario:usuarios(id, nome, sobrenome)
    `,
      { count: 'exact' }
    )
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (metrica) {
    query = query.eq('metrica', metrica)
  }

  if (periodo) {
    query = query.eq('periodo', periodo)
  }

  if (equipeId) {
    query = query.eq('equipe_id', equipeId)
  }

  if (usuarioId) {
    query = query.eq('usuario_id', usuarioId)
  }

  if (ativa !== undefined) {
    query = query.eq('ativa', ativa)
  }

  const { data, error, count } = await query.order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar metas: ${error.message}`)
  }

  const metas = (data || []).map(processarMetaComProgresso)

  return {
    metas: metas as MetaComProgresso[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Meta por ID
// =====================================================

export async function buscarMeta(
  organizacaoId: string,
  metaId: string
): Promise<MetaDetalhada | null> {
  const { data, error } = await supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao),
      equipe:equipes(id, nome),
      usuario:usuarios(id, nome, sobrenome),
      metas_filhas:metas!meta_pai_id(
        *,
        progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao),
        equipe:equipes(id, nome),
        usuario:usuarios(id, nome, sobrenome)
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('id', metaId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar meta: ${error.message}`)
  }

  const metaProcessada = processarMetaComProgresso(data)
  const metasFilhas = (data.metas_filhas || []).map(processarMetaComProgresso)

  return {
    ...metaProcessada,
    metas_filhas: metasFilhas,
  } as MetaDetalhada
}

// =====================================================
// Criar Meta
// =====================================================

export async function criarMeta(
  organizacaoId: string,
  payload: CriarMetaPayload,
  criadoPor?: string
): Promise<Meta> {
  const { data, error } = await supabase
    .from('metas')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar meta: ${error.message}`)
  }

  // Criar registro de progresso inicial
  await supabase.from('metas_progresso').insert({
    meta_id: data.id,
    valor_atual: 0,
    percentual_atingido: 0,
  })

  return data as Meta
}

// =====================================================
// Atualizar Meta
// =====================================================

export async function atualizarMeta(
  organizacaoId: string,
  metaId: string,
  payload: AtualizarMetaPayload
): Promise<Meta> {
  const { data, error } = await supabase
    .from('metas')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', metaId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar meta: ${error.message}`)
  }

  return data as Meta
}

// =====================================================
// Excluir Meta (Soft Delete)
// =====================================================

export async function excluirMeta(
  organizacaoId: string,
  metaId: string
): Promise<void> {
  // Excluir metas filhas primeiro
  await supabase
    .from('metas')
    .update({
      deletado_em: new Date().toISOString(),
      ativa: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('meta_pai_id', metaId)

  // Excluir meta pai
  const { error } = await supabase
    .from('metas')
    .update({
      deletado_em: new Date().toISOString(),
      ativa: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', metaId)

  if (error) {
    throw new Error(`Erro ao excluir meta: ${error.message}`)
  }
}

// =====================================================
// Distribuir Meta
// =====================================================

export async function distribuirMeta(
  organizacaoId: string,
  metaId: string,
  payload: DistribuirMetaPayload,
  criadoPor?: string
): Promise<Meta[]> {
  const metaPai = await buscarMeta(organizacaoId, metaId)

  if (!metaPai) {
    throw new Error('Meta nao encontrada')
  }

  // Validar nivel de distribuicao
  if (metaPai.tipo === 'individual') {
    throw new Error('Metas individuais nao podem ser distribuidas')
  }

  if (metaPai.tipo === 'equipe' && payload.nivel_destino === 'equipe') {
    throw new Error('Meta de equipe so pode ser distribuida para individuos')
  }

  // Buscar destinatarios
  const destinatarios = await buscarDestinatariosDistribuicao(
    organizacaoId,
    metaPai,
    payload.nivel_destino
  )

  if (destinatarios.length === 0) {
    throw new Error('Nenhum destinatario encontrado para distribuicao')
  }

  // Calcular valores
  // AIDEV-NOTE: Cast para o tipo esperado - payload.distribuicao ja foi validado pelo Zod
  const distribuicao = calcularDistribuicao(
    metaPai.valor_alvo,
    destinatarios,
    payload.tipo_distribuicao,
    payload.distribuicao as DistribuicaoItem[] | undefined
  )

  // Criar metas filhas
  const metasCriadas: Meta[] = []

  for (const item of distribuicao) {
    const novaMeta = await criarMeta(
      organizacaoId,
      {
        tipo: payload.nivel_destino,
        metrica: metaPai.metrica,
        valor_alvo: item.valor,
        periodo: metaPai.periodo,
        data_inicio: metaPai.data_inicio,
        data_fim: metaPai.data_fim,
        equipe_id: payload.nivel_destino === 'equipe' ? item.id : undefined,
        usuario_id: payload.nivel_destino === 'individual' ? item.id : undefined,
        meta_pai_id: metaId,
      },
      criadoPor
    )

    metasCriadas.push(novaMeta)
  }

  // Atualizar meta pai com tipo de distribuicao
  await atualizarMeta(organizacaoId, metaId, {
    // Armazenar tipo de distribuicao usado
  })

  return metasCriadas
}

async function buscarDestinatariosDistribuicao(
  organizacaoId: string,
  metaPai: MetaDetalhada,
  nivelDestino: 'equipe' | 'individual'
): Promise<Array<{ id: string; nome: string }>> {
  if (nivelDestino === 'equipe') {
    // Buscar equipes da organizacao
    const { data } = await supabase
      .from('equipes')
      .select('id, nome')
      .eq('organizacao_id', organizacaoId)
      .eq('ativa', true)
      .is('deletado_em', null)

    return data || []
  }

  if (nivelDestino === 'individual') {
    // Se meta de equipe, buscar membros da equipe
    if (metaPai.equipe_id) {
      const { data } = await supabase
        .from('equipes_membros')
        .select('usuario_id, usuario:usuarios(id, nome)')
        .eq('equipe_id', metaPai.equipe_id)

      return (data || []).map((m) => {
        // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
        const usuario = Array.isArray(m.usuario) ? m.usuario[0] : m.usuario
        return {
          id: m.usuario_id as string,
          nome: (usuario as { id: string; nome: string })?.nome || '',
        }
      })
    }

    // Se meta da empresa, buscar todos usuarios ativos
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'ativo')

    return data || []
  }

  return []
}

function calcularDistribuicao(
  valorTotal: number,
  destinatarios: Array<{ id: string; nome: string }>,
  tipoDistribuicao: 'igual' | 'proporcional' | 'manual',
  distribuicaoManual?: DistribuicaoItem[]
): Array<{ id: string; valor: number }> {
  if (tipoDistribuicao === 'manual' && distribuicaoManual) {
    // AIDEV-NOTE: Extrair apenas id e valor do DistribuicaoItem
    return distribuicaoManual.map(({ id, valor }) => ({ id, valor }))
  }

  if (tipoDistribuicao === 'igual') {
    const valorPorDestinatario = valorTotal / destinatarios.length
    return destinatarios.map((d) => ({
      id: d.id,
      valor: Math.round(valorPorDestinatario * 100) / 100,
    }))
  }

  // Proporcional - por simplicidade, usar distribuicao igual
  // AIDEV-TODO: Implementar distribuicao proporcional baseada em historico
  const valorPorDestinatario = valorTotal / destinatarios.length
  return destinatarios.map((d) => ({
    id: d.id,
    valor: Math.round(valorPorDestinatario * 100) / 100,
  }))
}

// =====================================================
// Metas da Empresa
// =====================================================

export async function buscarMetasEmpresa(
  organizacaoId: string
): Promise<MetasEmpresaResponse> {
  const { data, error } = await supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao),
      metas_filhas:metas!meta_pai_id(
        *,
        progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao),
        equipe:equipes(id, nome),
        usuario:usuarios(id, nome, sobrenome)
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('tipo', 'empresa')
    .eq('ativa', true)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar metas da empresa: ${error.message}`)
  }

  const metas = (data || []).map((m) => {
    const metaProcessada = processarMetaComProgresso(m)
    const metasFilhas = (m.metas_filhas || []).map(processarMetaComProgresso)
    return {
      ...metaProcessada,
      metas_filhas: metasFilhas,
    }
  })

  // Calcular resumo
  const totalMetas = metas.length
  const metasAtingidas = metas.filter(
    (m) => m.progresso && m.progresso.percentual_atingido >= 100
  ).length
  const mediaAtingimento =
    metas.reduce((acc, m) => acc + (m.progresso?.percentual_atingido || 0), 0) / (totalMetas || 1)
  const metasEmRisco = metas.filter(
    (m) => m.progresso && m.progresso.percentual_atingido < 50
  ).length

  return {
    metas: metas as MetaDetalhada[],
    resumo: {
      total_metas: totalMetas,
      media_atingimento: Math.round(mediaAtingimento * 100) / 100,
      metas_atingidas: metasAtingidas,
      metas_em_risco: metasEmRisco,
    },
  }
}

// =====================================================
// Metas por Equipe
// =====================================================

export async function buscarMetasEquipe(
  organizacaoId: string,
  equipeId: string
): Promise<MetasEquipeResponse> {
  // Buscar dados da equipe
  const { data: equipe } = await supabase
    .from('equipes')
    .select('id, nome')
    .eq('id', equipeId)
    .single()

  if (!equipe) {
    throw new Error('Equipe nao encontrada')
  }

  // Buscar metas da equipe
  const { data: metasEquipe } = await supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('equipe_id', equipeId)
    .eq('tipo', 'equipe')
    .eq('ativa', true)
    .is('deletado_em', null)

  // Buscar membros da equipe
  const { data: membros } = await supabase
    .from('equipes_membros')
    .select('usuario_id, usuario:usuarios(id, nome, sobrenome)')
    .eq('equipe_id', equipeId)

  // Buscar metas individuais de cada membro
  const membrosMetas = await Promise.all(
    (membros || []).map(async (m) => {
      const { data: metasUsuario } = await supabase
        .from('metas')
        .select(
          `
          *,
          progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao)
        `
        )
        .eq('organizacao_id', organizacaoId)
        .eq('usuario_id', m.usuario_id)
        .eq('tipo', 'individual')
        .eq('ativa', true)
        .is('deletado_em', null)

      // AIDEV-NOTE: Supabase pode retornar array ou objeto dependendo da relacao
      const usuarioData = Array.isArray(m.usuario) ? m.usuario[0] : m.usuario
      const usuario = usuarioData as { id: string; nome: string; sobrenome?: string }

      return {
        usuario_id: m.usuario_id as string,
        usuario_nome: `${usuario?.nome || ''} ${usuario?.sobrenome || ''}`.trim(),
        metas: (metasUsuario || []).map(processarMetaComProgresso),
      }
    })
  )

  return {
    equipe_id: equipe.id,
    equipe_nome: equipe.nome,
    metas: (metasEquipe || []).map(processarMetaComProgresso) as MetaComProgresso[],
    membros_metas: membrosMetas,
  }
}

// =====================================================
// Progresso Geral
// =====================================================

export async function buscarProgressoGeral(
  organizacaoId: string
): Promise<ProgressoGeral> {
  // Buscar metas da empresa
  const { data: metasEmpresa } = await supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(valor_atual, percentual_atingido)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('tipo', 'empresa')
    .eq('ativa', true)
    .is('deletado_em', null)

  // Buscar equipes com suas metas
  const { data: equipes } = await supabase
    .from('equipes')
    .select(
      `
      id,
      nome,
      metas:metas(
        id,
        progresso:metas_progresso(percentual_atingido)
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('ativa', true)
    .is('deletado_em', null)

  // Calcular metricas da empresa
  const totalMetasEmpresa = (metasEmpresa || []).length
  const metasAtingidasEmpresa = (metasEmpresa || []).filter(
    (m) => m.progresso && m.progresso.percentual_atingido >= 100
  ).length
  const mediaAtingimentoEmpresa =
    (metasEmpresa || []).reduce(
      (acc, m) => acc + (m.progresso?.percentual_atingido || 0),
      0
    ) / (totalMetasEmpresa || 1)
  const valorTotalAlvo = (metasEmpresa || []).reduce((acc, m) => acc + m.valor_alvo, 0)
  const valorTotalAtual = (metasEmpresa || []).reduce(
    (acc, m) => acc + (m.progresso?.valor_atual || 0),
    0
  )

  // Calcular metricas por equipe
  const equipesMetricas = (equipes || []).map((e) => {
    const metas = e.metas || []
    const totalMetas = metas.length
    const mediaAtingimento =
      metas.reduce(
        (acc: number, m: Record<string, unknown>) =>
          acc + ((m.progresso as Record<string, number>)?.percentual_atingido || 0),
        0
      ) / (totalMetas || 1)

    return {
      equipe_id: e.id,
      equipe_nome: e.nome,
      total_metas: totalMetas,
      media_atingimento: Math.round(mediaAtingimento * 100) / 100,
    }
  })

  // Periodo atual
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
  const diasRestantes = Math.ceil((fimMes.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

  return {
    empresa: {
      total_metas: totalMetasEmpresa,
      metas_atingidas: metasAtingidasEmpresa,
      media_atingimento: Math.round(mediaAtingimentoEmpresa * 100) / 100,
      valor_total_alvo: valorTotalAlvo,
      valor_total_atual: valorTotalAtual,
    },
    equipes: equipesMetricas,
    periodo_atual: {
      inicio: inicioMes.toISOString(),
      fim: fimMes.toISOString(),
      dias_restantes: diasRestantes,
    },
  }
}

// =====================================================
// Ranking
// =====================================================

export async function buscarRanking(
  organizacaoId: string,
  filtros?: {
    metrica?: Metrica
    periodo?: PeriodoMeta
    equipeId?: string
    limit?: number
  }
): Promise<RankingResponse> {
  const { metrica = 'valor_vendas', equipeId, limit = 10 } = filtros || {}

  // Buscar metas individuais com progresso
  let query = supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(valor_atual, percentual_atingido),
      usuario:usuarios(id, nome, avatar_url),
      equipe:equipes(nome)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('tipo', 'individual')
    .eq('metrica', metrica)
    .eq('ativa', true)
    .is('deletado_em', null)

  if (equipeId) {
    // Buscar usuarios da equipe
    const { data: membros } = await supabase
      .from('equipes_membros')
      .select('usuario_id')
      .eq('equipe_id', equipeId)

    const usuarioIds = (membros || []).map((m) => m.usuario_id)
    query = query.in('usuario_id', usuarioIds)
  }

  const { data } = await query

  // Ordenar por percentual atingido
  const metasOrdenadas = (data || [])
    .sort((a, b) => {
      const pctA = a.progresso?.percentual_atingido || 0
      const pctB = b.progresso?.percentual_atingido || 0
      return pctB - pctA
    })
    .slice(0, limit)

  // Montar ranking
  const ranking = metasOrdenadas.map((m, index) => ({
    posicao: index + 1,
    usuario_id: m.usuario_id,
    usuario_nome: (m.usuario as Record<string, string>)?.nome || 'Usuario',
    avatar_url: (m.usuario as Record<string, string>)?.avatar_url || null,
    equipe_nome: (m.equipe as Record<string, string>)?.nome || null,
    valor_atingido: m.progresso?.valor_atual || 0,
    percentual_meta: m.progresso?.percentual_atingido || 0,
    variacao: 0, // AIDEV-TODO: Calcular variacao comparando com periodo anterior
  }))

  // Periodo atual
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)

  return {
    ranking,
    metrica,
    periodo: {
      inicio: inicioMes.toISOString(),
      fim: fimMes.toISOString(),
    },
    atualizado_em: new Date().toISOString(),
  }
}

// =====================================================
// Minhas Metas (Member)
// =====================================================

export async function buscarMinhasMetas(
  organizacaoId: string,
  usuarioId: string
): Promise<MinhasMetasResponse> {
  const { data } = await supabase
    .from('metas')
    .select(
      `
      *,
      progresso:metas_progresso(id, valor_atual, percentual_atingido, ultima_atualizacao)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'individual')
    .eq('ativa', true)
    .is('deletado_em', null)
    .order('data_fim', { ascending: true })

  const metas = (data || []).map(processarMetaComProgresso)

  // Calcular resumo
  const totalMetas = metas.length
  const metasAtingidas = metas.filter(
    (m) => m.progresso && m.progresso.percentual_atingido >= 100
  ).length
  const mediaAtingimento =
    metas.reduce((acc, m) => acc + (m.progresso?.percentual_atingido || 0), 0) / (totalMetas || 1)

  // Proxima meta a vencer
  const proximaMeta = metas.find((m) => m.progresso && m.progresso.percentual_atingido < 100) || null

  // Buscar posicao no ranking
  const ranking = await buscarRanking(organizacaoId, { limit: 100 })
  const posicaoRanking =
    ranking.ranking.findIndex((r) => r.usuario_id === usuarioId) + 1 || null

  return {
    metas: metas as MetaComProgresso[],
    resumo: {
      total_metas: totalMetas,
      metas_atingidas: metasAtingidas,
      media_atingimento: Math.round(mediaAtingimento * 100) / 100,
      proxima_meta: proximaMeta as MetaComProgresso,
    },
    posicao_ranking: posicaoRanking,
  }
}

// =====================================================
// Atualizar Progresso
// =====================================================

export async function atualizarProgresso(
  metaId: string,
  valorAtual: number
): Promise<void> {
  // Buscar meta para calcular percentual
  const { data: meta } = await supabase
    .from('metas')
    .select('valor_alvo')
    .eq('id', metaId)
    .single()

  if (!meta) {
    throw new Error('Meta nao encontrada')
  }

  const percentualAtingido = (valorAtual / meta.valor_alvo) * 100

  const { error } = await supabase
    .from('metas_progresso')
    .update({
      valor_atual: valorAtual,
      percentual_atingido: Math.min(percentualAtingido, 100),
      ultima_atualizacao: new Date().toISOString(),
    })
    .eq('meta_id', metaId)

  if (error) {
    throw new Error(`Erro ao atualizar progresso: ${error.message}`)
  }
}

// =====================================================
// Helpers
// =====================================================

// AIDEV-NOTE: Interface interna para meta com progresso processado
interface MetaProcessada extends Record<string, unknown> {
  progresso: { percentual_atingido: number; valor_atual: number } | null
  equipe_nome: string | null
  usuario_nome: string | null
}

function processarMetaComProgresso(meta: Record<string, unknown>): MetaProcessada {
  const progresso = Array.isArray(meta.progresso)
    ? meta.progresso[0]
    : meta.progresso

  return {
    ...meta,
    progresso: progresso as MetaProcessada['progresso'] || null,
    equipe_nome: (meta.equipe as Record<string, string>)?.nome || null,
    usuario_nome: meta.usuario
      ? `${(meta.usuario as Record<string, string>).nome} ${(meta.usuario as Record<string, string>).sobrenome || ''}`.trim()
      : null,
  }
}

export default {
  listarMetas,
  buscarMeta,
  criarMeta,
  atualizarMeta,
  excluirMeta,
  distribuirMeta,
  buscarMetasEmpresa,
  buscarMetasEquipe,
  buscarProgressoGeral,
  buscarRanking,
  buscarMinhasMetas,
  atualizarProgresso,
}
