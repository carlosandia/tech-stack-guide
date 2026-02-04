/**
 * AIDEV-NOTE: Service para Oportunidades (Negocios)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Oportunidades sao os cards do Kanban.
 * Vinculadas a: Funil, Etapa, Contato, Usuario Responsavel.
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  Oportunidade,
  CriarOportunidadePayload,
  AtualizarOportunidadePayload,
  ListaOportunidadesResponse,
  ListarOportunidadesQuery,
  MoverEtapaPayload,
  FecharOportunidadePayload,
  OportunidadeKanban,
  OportunidadeDetalhe,
  KanbanResponse,
} from '../schemas/oportunidades'
import * as etapasFunilService from './etapas-funil.service'

const supabase = supabaseAdmin

// =====================================================
// Listar Oportunidades
// =====================================================

export async function listarOportunidades(
  organizacaoId: string,
  query: ListarOportunidadesQuery
): Promise<ListaOportunidadesResponse> {
  let queryBuilder = supabase
    .from('oportunidades')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  // Filtros
  if (query.funil_id) {
    queryBuilder = queryBuilder.eq('funil_id', query.funil_id)
  }

  if (query.etapa_id) {
    queryBuilder = queryBuilder.eq('etapa_id', query.etapa_id)
  }

  if (query.contato_id) {
    queryBuilder = queryBuilder.eq('contato_id', query.contato_id)
  }

  if (query.usuario_responsavel_id) {
    queryBuilder = queryBuilder.eq('usuario_responsavel_id', query.usuario_responsavel_id)
  }

  if (query.qualificado_mql !== undefined) {
    queryBuilder = queryBuilder.eq('qualificado_mql', query.qualificado_mql)
  }

  if (query.qualificado_sql !== undefined) {
    queryBuilder = queryBuilder.eq('qualificado_sql', query.qualificado_sql)
  }

  if (query.fechado !== undefined) {
    if (query.fechado) {
      queryBuilder = queryBuilder.not('fechado_em', 'is', null)
    } else {
      queryBuilder = queryBuilder.is('fechado_em', null)
    }
  }

  if (query.busca) {
    queryBuilder = queryBuilder.ilike('titulo', `%${query.busca}%`)
  }

  if (query.valor_min !== undefined) {
    queryBuilder = queryBuilder.gte('valor', query.valor_min)
  }

  if (query.valor_max !== undefined) {
    queryBuilder = queryBuilder.lte('valor', query.valor_max)
  }

  if (query.data_criacao_inicio) {
    queryBuilder = queryBuilder.gte('criado_em', query.data_criacao_inicio)
  }

  if (query.data_criacao_fim) {
    queryBuilder = queryBuilder.lte('criado_em', query.data_criacao_fim)
  }

  // Ordenacao
  const ascending = query.ordem === 'asc'
  queryBuilder = queryBuilder.order(query.ordenar_por, { ascending })

  // Paginacao
  const offset = (query.page - 1) * query.per_page
  queryBuilder = queryBuilder.range(offset, offset + query.per_page - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    throw new Error(`Erro ao listar oportunidades: ${error.message}`)
  }

  return {
    oportunidades: data as Oportunidade[],
    total: count || 0,
    page: query.page,
    per_page: query.per_page,
    total_pages: Math.ceil((count || 0) / query.per_page),
  }
}

// =====================================================
// Buscar Oportunidade por ID
// =====================================================

export async function buscarOportunidade(
  organizacaoId: string,
  oportunidadeId: string
): Promise<Oportunidade | null> {
  const { data, error } = await supabase
    .from('oportunidades')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar oportunidade: ${error.message}`)
  }

  return data as Oportunidade
}

// =====================================================
// Buscar Oportunidade com Detalhes (para Modal)
// =====================================================

export async function buscarOportunidadeDetalhe(
  organizacaoId: string,
  oportunidadeId: string
): Promise<OportunidadeDetalhe | null> {
  const { data, error } = await supabase
    .from('oportunidades')
    .select(
      `
      *,
      funil:funil_id (
        id, nome, cor
      ),
      etapa:etapa_id (
        id, nome, tipo, cor, probabilidade
      ),
      contato:contato_id (
        id, tipo, nome, email, telefone
      ),
      responsavel:usuario_responsavel_id (
        id, nome, email, avatar_url
      ),
      motivo_resultado:motivo_resultado_id (
        id, nome, tipo
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar oportunidade: ${error.message}`)
  }

  // Buscar produtos
  const { data: produtos } = await supabase
    .from('oportunidades_produtos')
    .select(
      `
      id,
      produto_id,
      quantidade,
      preco_unitario,
      desconto_percentual,
      subtotal,
      produto:produto_id (nome)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('oportunidade_id', oportunidadeId)

  // Buscar campos customizados
  const { data: camposValores } = await supabase
    .from('valores_campos_customizados')
    .select(
      `
      valor,
      campo:campo_id (
        id, nome, tipo
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('entidade_id', oportunidadeId)

  // Buscar contadores
  const [anotacoes, documentos, emails, reunioes, tarefasPendentes, tarefasConcluidas] =
    await Promise.all([
      supabase
        .from('anotacoes_oportunidades')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .is('deletado_em', null),
      supabase
        .from('documentos_oportunidades')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .is('deletado_em', null),
      supabase
        .from('emails_oportunidades')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .is('deletado_em', null),
      supabase
        .from('reunioes_oportunidades')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .is('deletado_em', null),
      supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .eq('status', 'pendente'),
      supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .eq('oportunidade_id', oportunidadeId)
        .eq('status', 'concluida'),
    ])

  return {
    ...data,
    produtos: (produtos || []).map((p: any) => ({
      ...p,
      nome: p.produto?.nome || '',
    })),
    campos_customizados: (camposValores || []).map((cv: any) => ({
      campo_id: cv.campo.id,
      nome: cv.campo.nome,
      tipo: cv.campo.tipo,
      valor: cv.valor,
    })),
    total_anotacoes: anotacoes.count || 0,
    total_documentos: documentos.count || 0,
    total_emails: emails.count || 0,
    total_reunioes: reunioes.count || 0,
    tarefas_pendentes: tarefasPendentes.count || 0,
    tarefas_concluidas: tarefasConcluidas.count || 0,
  } as OportunidadeDetalhe
}

// =====================================================
// Criar Oportunidade
// =====================================================

export async function criarOportunidade(
  organizacaoId: string,
  payload: CriarOportunidadePayload,
  criadoPor?: string
): Promise<Oportunidade> {
  // Buscar etapa de entrada se nao informada
  let etapaId = payload.etapa_id
  if (!etapaId) {
    const etapaEntrada = await etapasFunilService.buscarEtapaEntrada(
      organizacaoId,
      payload.funil_id
    )
    if (!etapaEntrada) {
      throw new Error('Funil nao possui etapa de entrada configurada')
    }
    etapaId = etapaEntrada.id
  }

  // Criar contato inline se necessario
  let contatoId = payload.contato_id
  if (!contatoId && payload.contato) {
    const { data: novoContato, error: contatoError } = await supabase
      .from('contatos')
      .insert({
        organizacao_id: organizacaoId,
        tipo: 'pessoa',
        nome: payload.contato.nome,
        email: payload.contato.email,
        telefone: payload.contato.telefone,
      })
      .select()
      .single()

    if (contatoError) {
      throw new Error(`Erro ao criar contato: ${contatoError.message}`)
    }
    contatoId = novoContato.id
  }

  if (!contatoId) {
    throw new Error('Contato e obrigatorio')
  }

  // Criar oportunidade
  const { data: oportunidade, error } = await supabase
    .from('oportunidades')
    .insert({
      organizacao_id: organizacaoId,
      funil_id: payload.funil_id,
      etapa_id: etapaId,
      contato_id: contatoId,
      titulo: payload.titulo,
      valor: payload.valor || 0,
      tipo_valor: payload.tipo_valor || 'manual',
      moeda: payload.moeda || 'BRL',
      previsao_fechamento: payload.previsao_fechamento,
      usuario_responsavel_id: payload.usuario_responsavel_id,
      observacoes: payload.observacoes,
      utm_source: payload.utm_source,
      utm_campaign: payload.utm_campaign,
      utm_medium: payload.utm_medium,
      utm_term: payload.utm_term,
      utm_content: payload.utm_content,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar oportunidade: ${error.message}`)
  }

  // Adicionar produtos se tipo_valor = 'produtos'
  if (payload.tipo_valor === 'produtos' && payload.produtos && payload.produtos.length > 0) {
    const produtosInsert = payload.produtos.map((p) => ({
      organizacao_id: organizacaoId,
      oportunidade_id: oportunidade.id,
      produto_id: p.produto_id,
      quantidade: p.quantidade,
      preco_unitario: p.preco_unitario || 0,
      desconto_percentual: p.desconto_percentual || 0,
      subtotal: 0, // Sera calculado por trigger
    }))

    await supabase.from('oportunidades_produtos').insert(produtosInsert)
  }

  // Salvar campos customizados
  if (payload.campos_customizados) {
    const camposInsert = Object.entries(payload.campos_customizados).map(([campoId, valor]) => ({
      organizacao_id: organizacaoId,
      campo_id: campoId,
      entidade_id: oportunidade.id,
      valor,
    }))

    await supabase.from('valores_campos_customizados').insert(camposInsert)
  }

  return oportunidade as Oportunidade
}

// =====================================================
// Atualizar Oportunidade
// =====================================================

export async function atualizarOportunidade(
  organizacaoId: string,
  oportunidadeId: string,
  payload: AtualizarOportunidadePayload
): Promise<Oportunidade> {
  const oportunidadeExistente = await buscarOportunidade(organizacaoId, oportunidadeId)
  if (!oportunidadeExistente) {
    throw new Error('Oportunidade nao encontrada')
  }

  const { campos_customizados, ...dadosOportunidade } = payload

  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      ...dadosOportunidade,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar oportunidade: ${error.message}`)
  }

  // Atualizar campos customizados
  if (campos_customizados) {
    for (const [campoId, valor] of Object.entries(campos_customizados)) {
      const { data: existente } = await supabase
        .from('valores_campos_customizados')
        .select('id')
        .eq('organizacao_id', organizacaoId)
        .eq('campo_id', campoId)
        .eq('entidade_id', oportunidadeId)
        .single()

      if (existente) {
        await supabase
          .from('valores_campos_customizados')
          .update({ valor, atualizado_em: new Date().toISOString() })
          .eq('id', existente.id)
      } else {
        await supabase.from('valores_campos_customizados').insert({
          organizacao_id: organizacaoId,
          campo_id: campoId,
          entidade_id: oportunidadeId,
          valor,
        })
      }
    }
  }

  return data as Oportunidade
}

// =====================================================
// Excluir Oportunidade (Soft Delete)
// =====================================================

export async function excluirOportunidade(
  organizacaoId: string,
  oportunidadeId: string
): Promise<void> {
  const oportunidadeExistente = await buscarOportunidade(organizacaoId, oportunidadeId)
  if (!oportunidadeExistente) {
    throw new Error('Oportunidade nao encontrada')
  }

  const { error } = await supabase
    .from('oportunidades')
    .update({ deletado_em: new Date().toISOString() })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)

  if (error) {
    throw new Error(`Erro ao excluir oportunidade: ${error.message}`)
  }
}

// =====================================================
// Mover Oportunidade de Etapa (Drag & Drop)
// =====================================================

export async function moverEtapa(
  organizacaoId: string,
  oportunidadeId: string,
  payload: MoverEtapaPayload
): Promise<Oportunidade> {
  const oportunidade = await buscarOportunidade(organizacaoId, oportunidadeId)
  if (!oportunidade) {
    throw new Error('Oportunidade nao encontrada')
  }

  // Verificar se etapa destino pertence ao mesmo funil
  const etapaDestino = await etapasFunilService.buscarEtapa(organizacaoId, payload.etapa_destino_id)
  if (!etapaDestino) {
    throw new Error('Etapa de destino nao encontrada')
  }

  if (etapaDestino.funil_id !== oportunidade.funil_id) {
    throw new Error('Etapa de destino pertence a outro funil')
  }

  // Se movendo para etapa de ganho/perda, deve usar endpoint de fechar
  if (['ganho', 'perda'].includes(etapaDestino.tipo)) {
    throw new Error(`Use o endpoint de fechar oportunidade para mover para etapa "${etapaDestino.tipo}"`)
  }

  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      etapa_id: payload.etapa_destino_id,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao mover oportunidade: ${error.message}`)
  }

  return data as Oportunidade
}

// =====================================================
// Fechar Oportunidade (Ganho/Perda)
// =====================================================

export async function fecharOportunidade(
  organizacaoId: string,
  oportunidadeId: string,
  payload: FecharOportunidadePayload
): Promise<Oportunidade> {
  const oportunidade = await buscarOportunidade(organizacaoId, oportunidadeId)
  if (!oportunidade) {
    throw new Error('Oportunidade nao encontrada')
  }

  if (oportunidade.fechado_em) {
    throw new Error('Oportunidade ja esta fechada')
  }

  // Buscar etapa de ganho ou perda
  const { data: etapaFinal } = await supabase
    .from('etapas_funil')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', oportunidade.funil_id)
    .eq('tipo', payload.tipo)
    .is('deletado_em', null)
    .single()

  if (!etapaFinal) {
    throw new Error(`Etapa de ${payload.tipo} nao encontrada`)
  }

  // Verificar se motivo e obrigatorio
  const { data: funil } = await supabase
    .from('funis')
    .select('exigir_motivo_resultado')
    .eq('id', oportunidade.funil_id)
    .single()

  if (funil?.exigir_motivo_resultado && !payload.motivo_id) {
    throw new Error('Motivo e obrigatorio para fechar esta oportunidade')
  }

  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      etapa_id: etapaFinal.id,
      fechado_em: new Date().toISOString(),
      motivo_resultado_id: payload.motivo_id,
      observacoes: payload.observacoes || oportunidade.observacoes,
      valor: payload.valor_final ?? oportunidade.valor,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao fechar oportunidade: ${error.message}`)
  }

  return data as Oportunidade
}

// =====================================================
// Atribuir Responsavel
// =====================================================

export async function atribuirResponsavel(
  organizacaoId: string,
  oportunidadeId: string,
  usuarioResponsavelId: string | null
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      usuario_responsavel_id: usuarioResponsavelId,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atribuir responsavel: ${error.message}`)
  }

  return data as Oportunidade
}

// =====================================================
// Qualificar Oportunidade (MQL/SQL)
// =====================================================

export async function qualificar(
  organizacaoId: string,
  oportunidadeId: string,
  tipo: 'mql' | 'sql',
  qualificado: boolean
): Promise<Oportunidade> {
  const campo = tipo === 'mql' ? 'qualificado_mql' : 'qualificado_sql'
  const campoData = tipo === 'mql' ? 'qualificado_mql_em' : 'qualificado_sql_em'

  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      [campo]: qualificado,
      [campoData]: qualificado ? new Date().toISOString() : null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', oportunidadeId)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao qualificar oportunidade: ${error.message}`)
  }

  return data as Oportunidade
}

// =====================================================
// Obter Kanban (Dados completos do board)
// =====================================================

export async function obterKanban(
  organizacaoId: string,
  funilId: string,
  filtros?: Partial<ListarOportunidadesQuery>
): Promise<KanbanResponse> {
  // Buscar funil
  const { data: funil, error: funilError } = await supabase
    .from('funis')
    .select('id, nome, cor')
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)
    .is('deletado_em', null)
    .single()

  if (funilError || !funil) {
    throw new Error('Funil nao encontrado')
  }

  // Buscar etapas
  const { data: etapas } = await supabase
    .from('etapas_funil')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .order('ordem', { ascending: true })

  // Buscar oportunidades com filtros
  let oportunidadesQuery = supabase
    .from('oportunidades')
    .select(
      `
      id, titulo, valor, moeda, etapa_id, previsao_fechamento,
      qualificado_mql, qualificado_sql, criado_em,
      contato:contato_id (id, nome, email, telefone, tipo),
      responsavel:usuario_responsavel_id (id, nome, avatar_url)
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .is('fechado_em', null)

  if (filtros?.usuario_responsavel_id) {
    oportunidadesQuery = oportunidadesQuery.eq(
      'usuario_responsavel_id',
      filtros.usuario_responsavel_id
    )
  }

  if (filtros?.busca) {
    oportunidadesQuery = oportunidadesQuery.ilike('titulo', `%${filtros.busca}%`)
  }

  const { data: oportunidades } = await oportunidadesQuery

  // Calcular dias na etapa e agrupar por etapa
  const now = new Date()
  const etapasComOportunidades = (etapas || []).map((etapa) => {
    const opsEtapa = (oportunidades || [])
      .filter((op) => op.etapa_id === etapa.id)
      .map((op) => {
        const criadoEm = new Date(op.criado_em)
        const diasNaEtapa = Math.floor((now.getTime() - criadoEm.getTime()) / (1000 * 60 * 60 * 24))
        return {
          ...op,
          dias_na_etapa: diasNaEtapa,
          tarefas_pendentes: 0, // TODO: implementar contagem
          tem_anotacoes: false,
          tem_documentos: false,
          campos_card: [],
        } as OportunidadeKanban
      })

    return {
      id: etapa.id,
      nome: etapa.nome,
      tipo: etapa.tipo,
      cor: etapa.cor,
      probabilidade: etapa.probabilidade,
      ordem: etapa.ordem,
      total_oportunidades: opsEtapa.length,
      valor_total: opsEtapa.reduce((acc, op) => acc + (op.valor || 0), 0),
      oportunidades: opsEtapa,
    }
  })

  // Calcular metricas
  const todasOps = oportunidades || []
  const totalAberto = todasOps.reduce((acc, op) => acc + (op.valor || 0), 0)
  const quantidade = todasOps.length
  const ticketMedio = quantidade > 0 ? totalAberto / quantidade : 0

  // Ganhos/Perdidos do mes
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data: fechadasMes } = await supabase
    .from('oportunidades')
    .select('valor, etapa:etapa_id (tipo)')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .gte('fechado_em', inicioMes)
    .is('deletado_em', null)

  const ganhosMes = (fechadasMes || [])
    .filter((op: any) => op.etapa?.tipo === 'ganho')
    .reduce((acc, op) => acc + (op.valor || 0), 0)

  const perdidosMes = (fechadasMes || []).filter((op: any) => op.etapa?.tipo === 'perda').length

  const valorPerdido = (fechadasMes || [])
    .filter((op: any) => op.etapa?.tipo === 'perda')
    .reduce((acc, op) => acc + (op.valor || 0), 0)

  const taxaConversao =
    fechadasMes && fechadasMes.length > 0
      ? (fechadasMes.filter((op: any) => op.etapa?.tipo === 'ganho').length / fechadasMes.length) *
        100
      : 0

  return {
    funil,
    etapas: etapasComOportunidades,
    metricas: {
      total_aberto: totalAberto,
      quantidade,
      ticket_medio: ticketMedio,
      taxa_conversao: taxaConversao,
      ganhos_mes: ganhosMes,
      perdidos_mes: perdidosMes,
      valor_perdido: valorPerdido,
    },
    filtros_aplicados: filtros || {},
  }
}

export default {
  listarOportunidades,
  buscarOportunidade,
  buscarOportunidadeDetalhe,
  criarOportunidade,
  atualizarOportunidade,
  excluirOportunidade,
  moverEtapa,
  fecharOportunidade,
  atribuirResponsavel,
  qualificar,
  obterKanban,
}
