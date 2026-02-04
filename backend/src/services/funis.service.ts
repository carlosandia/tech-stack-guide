/**
 * AIDEV-NOTE: Service para Funis (Pipelines)
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Funis sao pipelines de vendas configuráveis por tenant.
 * Cada funil tem etapas, campos, regras e membros associados.
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  Funil,
  CriarFunilPayload,
  AtualizarFunilPayload,
  ListaFunisResponse,
  ListarFunisQuery,
  FunilComEtapas,
  VincularMembroPayload,
  VincularCampoPayload,
  AtualizarVinculoCampoPayload,
  VincularRegraPayload,
  VincularMotivoPayload,
} from '../schemas/funis'

const supabase = supabaseAdmin

// =====================================================
// Listar Funis
// =====================================================

export async function listarFunis(
  organizacaoId: string,
  query: ListarFunisQuery
): Promise<ListaFunisResponse> {
  let queryBuilder = supabase
    .from('funis')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  // Filtros
  if (query.ativo !== undefined) {
    queryBuilder = queryBuilder.eq('ativo', query.ativo)
  }

  if (query.arquivado !== undefined) {
    queryBuilder = queryBuilder.eq('arquivado', query.arquivado)
  }

  if (query.busca) {
    queryBuilder = queryBuilder.ilike('nome', `%${query.busca}%`)
  }

  // Paginacao
  const offset = (query.page - 1) * query.per_page
  queryBuilder = queryBuilder
    .order('criado_em', { ascending: false })
    .range(offset, offset + query.per_page - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    throw new Error(`Erro ao listar funis: ${error.message}`)
  }

  return {
    funis: data as Funil[],
    total: count || 0,
    page: query.page,
    per_page: query.per_page,
    total_pages: Math.ceil((count || 0) / query.per_page),
  }
}

// =====================================================
// Buscar Funil por ID
// =====================================================

export async function buscarFunil(
  organizacaoId: string,
  funilId: string
): Promise<Funil | null> {
  const { data, error } = await supabase
    .from('funis')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar funil: ${error.message}`)
  }

  return data as Funil
}

// =====================================================
// Buscar Funil com Etapas
// =====================================================

export async function buscarFunilComEtapas(
  organizacaoId: string,
  funilId: string
): Promise<FunilComEtapas | null> {
  // Buscar funil
  const funil = await buscarFunil(organizacaoId, funilId)
  if (!funil) return null

  // Buscar etapas
  const { data: etapas, error: etapasError } = await supabase
    .from('etapas_funil')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .order('ordem', { ascending: true })

  if (etapasError) {
    throw new Error(`Erro ao buscar etapas: ${etapasError.message}`)
  }

  // Buscar contagem de oportunidades por etapa
  const { data: contagens } = await supabase
    .from('oportunidades')
    .select('etapa_id, valor')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .is('fechado_em', null)

  // Calcular totais por etapa
  const totaisPorEtapa = (contagens || []).reduce((acc, op) => {
    if (!acc[op.etapa_id]) {
      acc[op.etapa_id] = { total: 0, valor: 0 }
    }
    acc[op.etapa_id].total++
    acc[op.etapa_id].valor += op.valor || 0
    return acc
  }, {} as Record<string, { total: number; valor: number }>)

  const etapasComContagem = (etapas || []).map((etapa) => ({
    ...etapa,
    total_oportunidades: totaisPorEtapa[etapa.id]?.total || 0,
    valor_total: totaisPorEtapa[etapa.id]?.valor || 0,
  }))

  // Calcular totais do funil
  const totalOportunidades = etapasComContagem.reduce((acc, e) => acc + e.total_oportunidades, 0)
  const valorTotal = etapasComContagem.reduce((acc, e) => acc + e.valor_total, 0)

  return {
    ...funil,
    etapas: etapasComContagem,
    total_oportunidades: totalOportunidades,
    valor_total: valorTotal,
  }
}

// =====================================================
// Criar Funil
// =====================================================

export async function criarFunil(
  organizacaoId: string,
  payload: CriarFunilPayload,
  criadoPor?: string
): Promise<Funil> {
  const { data: funil, error } = await supabase
    .from('funis')
    .insert({
      organizacao_id: organizacaoId,
      nome: payload.nome,
      descricao: payload.descricao,
      cor: payload.cor || '#3B82F6',
      exigir_motivo_resultado: payload.exigir_motivo_resultado ?? true,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar funil: ${error.message}`)
  }

  // Criar etapas iniciais (se fornecidas) ou etapas padrao
  const etapasParaCriar = payload.etapas_iniciais || [
    { nome: 'Entrada', tipo: 'entrada', cor: '#3B82F6', probabilidade: 10 },
    { nome: 'Qualificacao', tipo: 'normal', cor: '#F59E0B', probabilidade: 30 },
    { nome: 'Proposta', tipo: 'normal', cor: '#8B5CF6', probabilidade: 60 },
    { nome: 'Negociacao', tipo: 'normal', cor: '#EC4899', probabilidade: 80 },
    { nome: 'Ganho', tipo: 'ganho', cor: '#22C55E', probabilidade: 100 },
    { nome: 'Perdido', tipo: 'perda', cor: '#EF4444', probabilidade: 0 },
  ]

  const etapasInsert = etapasParaCriar.map((etapa, index) => ({
    organizacao_id: organizacaoId,
    funil_id: funil.id,
    nome: etapa.nome,
    tipo: etapa.tipo,
    cor: etapa.cor || '#6B7280',
    probabilidade: etapa.probabilidade ?? 0,
    ordem: index,
  }))

  const { error: etapasError } = await supabase.from('etapas_funil').insert(etapasInsert)

  if (etapasError) {
    // Rollback: deletar funil criado
    await supabase.from('funis').delete().eq('id', funil.id)
    throw new Error(`Erro ao criar etapas: ${etapasError.message}`)
  }

  return funil as Funil
}

// =====================================================
// Atualizar Funil
// =====================================================

export async function atualizarFunil(
  organizacaoId: string,
  funilId: string,
  payload: AtualizarFunilPayload
): Promise<Funil> {
  const funilExistente = await buscarFunil(organizacaoId, funilId)
  if (!funilExistente) {
    throw new Error('Funil nao encontrado')
  }

  const { data, error } = await supabase
    .from('funis')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar funil: ${error.message}`)
  }

  return data as Funil
}

// =====================================================
// Excluir Funil (Soft Delete)
// =====================================================

export async function excluirFunil(organizacaoId: string, funilId: string): Promise<void> {
  const funilExistente = await buscarFunil(organizacaoId, funilId)
  if (!funilExistente) {
    throw new Error('Funil nao encontrado')
  }

  // Verificar se tem oportunidades abertas
  const { count } = await supabase
    .from('oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .is('fechado_em', null)

  if (count && count > 0) {
    throw new Error(`Funil possui ${count} oportunidades abertas. Feche-as antes de excluir.`)
  }

  const { error } = await supabase
    .from('funis')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)

  if (error) {
    throw new Error(`Erro ao excluir funil: ${error.message}`)
  }
}

// =====================================================
// Arquivar/Desarquivar Funil
// =====================================================

export async function arquivarFunil(organizacaoId: string, funilId: string): Promise<Funil> {
  const funilExistente = await buscarFunil(organizacaoId, funilId)
  if (!funilExistente) {
    throw new Error('Funil nao encontrado')
  }

  const { data, error } = await supabase
    .from('funis')
    .update({
      arquivado: true,
      arquivado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao arquivar funil: ${error.message}`)
  }

  return data as Funil
}

export async function desarquivarFunil(organizacaoId: string, funilId: string): Promise<Funil> {
  const { data, error } = await supabase
    .from('funis')
    .update({
      arquivado: false,
      arquivado_em: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', funilId)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao desarquivar funil: ${error.message}`)
  }

  return data as Funil
}

// =====================================================
// Membros do Funil
// =====================================================

export async function listarMembros(organizacaoId: string, funilId: string) {
  const { data, error } = await supabase
    .from('funis_membros')
    .select(
      `
      *,
      usuario:usuario_id (
        id,
        nome,
        email,
        avatar_url
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('ativo', true)

  if (error) {
    throw new Error(`Erro ao listar membros: ${error.message}`)
  }

  return data
}

export async function vincularMembro(
  organizacaoId: string,
  funilId: string,
  payload: VincularMembroPayload
): Promise<void> {
  // Verificar se ja existe
  const { data: existente } = await supabase
    .from('funis_membros')
    .select('id, ativo')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('usuario_id', payload.usuario_id)
    .single()

  if (existente) {
    if (existente.ativo) {
      throw new Error('Usuario ja e membro deste funil')
    }
    // Reativar
    await supabase.from('funis_membros').update({ ativo: true }).eq('id', existente.id)
    return
  }

  const { error } = await supabase.from('funis_membros').insert({
    organizacao_id: organizacaoId,
    funil_id: funilId,
    usuario_id: payload.usuario_id,
  })

  if (error) {
    throw new Error(`Erro ao vincular membro: ${error.message}`)
  }
}

export async function desvincularMembro(
  organizacaoId: string,
  funilId: string,
  usuarioId: string
): Promise<void> {
  const { error } = await supabase
    .from('funis_membros')
    .update({ ativo: false })
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('usuario_id', usuarioId)

  if (error) {
    throw new Error(`Erro ao desvincular membro: ${error.message}`)
  }
}

// =====================================================
// Campos do Funil
// =====================================================

export async function listarCamposFunil(organizacaoId: string, funilId: string) {
  const { data, error } = await supabase
    .from('funis_campos')
    .select(
      `
      *,
      campo:campo_id (
        id,
        nome,
        tipo,
        obrigatorio,
        placeholder
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar campos: ${error.message}`)
  }

  return data
}

export async function vincularCampo(
  organizacaoId: string,
  funilId: string,
  payload: VincularCampoPayload
): Promise<void> {
  // Verificar se ja existe
  const { data: existente } = await supabase
    .from('funis_campos')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('campo_id', payload.campo_id)
    .single()

  if (existente) {
    throw new Error('Campo ja esta vinculado a este funil')
  }

  // Buscar proxima ordem
  const { data: ultimoCampo } = await supabase
    .from('funis_campos')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = payload.ordem ?? (ultimoCampo ? ultimoCampo.ordem + 1 : 0)

  const { error } = await supabase.from('funis_campos').insert({
    organizacao_id: organizacaoId,
    funil_id: funilId,
    campo_id: payload.campo_id,
    obrigatorio: payload.obrigatorio ?? false,
    visivel: payload.visivel ?? true,
    exibir_card: payload.exibir_card ?? false,
    ordem: novaOrdem,
  })

  if (error) {
    throw new Error(`Erro ao vincular campo: ${error.message}`)
  }
}

export async function atualizarVinculoCampo(
  organizacaoId: string,
  funilId: string,
  campoId: string,
  payload: AtualizarVinculoCampoPayload
): Promise<void> {
  const { error } = await supabase
    .from('funis_campos')
    .update(payload)
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('campo_id', campoId)

  if (error) {
    throw new Error(`Erro ao atualizar vinculo: ${error.message}`)
  }
}

export async function desvincularCampo(
  organizacaoId: string,
  funilId: string,
  campoId: string
): Promise<void> {
  const { error } = await supabase
    .from('funis_campos')
    .delete()
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('campo_id', campoId)

  if (error) {
    throw new Error(`Erro ao desvincular campo: ${error.message}`)
  }
}

// =====================================================
// Regras de Qualificacao do Funil
// =====================================================

export async function listarRegrasFunil(organizacaoId: string, funilId: string) {
  const { data, error } = await supabase
    .from('funis_regras_qualificacao')
    .select(
      `
      *,
      regra:regra_id (
        id,
        nome,
        tipo,
        condicoes
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('ativo', true)

  if (error) {
    throw new Error(`Erro ao listar regras: ${error.message}`)
  }

  return data
}

export async function vincularRegra(
  organizacaoId: string,
  funilId: string,
  payload: VincularRegraPayload
): Promise<void> {
  const { error } = await supabase
    .from('funis_regras_qualificacao')
    .upsert(
      {
        organizacao_id: organizacaoId,
        funil_id: funilId,
        regra_id: payload.regra_id,
        ativo: true,
      },
      { onConflict: 'funil_id,regra_id' }
    )

  if (error) {
    throw new Error(`Erro ao vincular regra: ${error.message}`)
  }
}

export async function desvincularRegra(
  organizacaoId: string,
  funilId: string,
  regraId: string
): Promise<void> {
  const { error } = await supabase
    .from('funis_regras_qualificacao')
    .update({ ativo: false })
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('regra_id', regraId)

  if (error) {
    throw new Error(`Erro ao desvincular regra: ${error.message}`)
  }
}

// =====================================================
// Motivos do Funil
// =====================================================

export async function listarMotivosFunil(organizacaoId: string, funilId: string) {
  const { data, error } = await supabase
    .from('funis_motivos')
    .select(
      `
      *,
      motivo:motivo_id (
        id,
        nome,
        tipo
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('ativo', true)

  if (error) {
    throw new Error(`Erro ao listar motivos: ${error.message}`)
  }

  return data
}

export async function vincularMotivo(
  organizacaoId: string,
  funilId: string,
  payload: VincularMotivoPayload
): Promise<void> {
  const { error } = await supabase
    .from('funis_motivos')
    .upsert(
      {
        organizacao_id: organizacaoId,
        funil_id: funilId,
        motivo_id: payload.motivo_id,
        ativo: true,
      },
      { onConflict: 'funil_id,motivo_id' }
    )

  if (error) {
    throw new Error(`Erro ao vincular motivo: ${error.message}`)
  }
}

export async function desvincularMotivo(
  organizacaoId: string,
  funilId: string,
  motivoId: string
): Promise<void> {
  const { error } = await supabase
    .from('funis_motivos')
    .update({ ativo: false })
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('motivo_id', motivoId)

  if (error) {
    throw new Error(`Erro ao desvincular motivo: ${error.message}`)
  }
}

// =====================================================
// Contadores para UI
// =====================================================

export async function obterContadores(organizacaoId: string) {
  const { data, error } = await supabase
    .from('funis')
    .select('arquivado')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (error) {
    throw new Error(`Erro ao obter contadores: ${error.message}`)
  }

  const total = data.length
  const arquivadas = data.filter((f) => f.arquivado).length
  const ativas = total - arquivadas

  return { total, ativas, arquivadas }
}

export default {
  listarFunis,
  buscarFunil,
  buscarFunilComEtapas,
  criarFunil,
  atualizarFunil,
  excluirFunil,
  arquivarFunil,
  desarquivarFunil,
  listarMembros,
  vincularMembro,
  desvincularMembro,
  listarCamposFunil,
  vincularCampo,
  atualizarVinculoCampo,
  desvincularCampo,
  listarRegrasFunil,
  vincularRegra,
  desvincularRegra,
  listarMotivosFunil,
  vincularMotivo,
  desvincularMotivo,
  obterContadores,
}
