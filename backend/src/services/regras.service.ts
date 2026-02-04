/**
 * AIDEV-NOTE: Service para Regras de Qualificacao (MQL)
 * Conforme PRD-05 - Regras de Qualificacao e Config do Card
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  RegraQualificacao,
  CriarRegraPayload,
  AtualizarRegraPayload,
  ListaRegrasResponse,
  ConfiguracaoCard,
  AtualizarConfigCardPayload,
} from '../schemas/regras'

// =====================================================
// REGRAS DE QUALIFICACAO
// =====================================================

export async function listarRegras(
  organizacaoId: string,
  filtros?: {
    ativa?: boolean
  }
): Promise<ListaRegrasResponse> {
  const { ativa } = filtros || {}

  let query = supabase
    .from('regras_qualificacao')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (ativa !== undefined) {
    query = query.eq('ativa', ativa)
  }

  const { data, error, count } = await query.order('prioridade', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar regras: ${error.message}`)
  }

  return {
    regras: data as RegraQualificacao[],
    total: count || 0,
  }
}

export async function buscarRegra(
  organizacaoId: string,
  regraId: string
): Promise<RegraQualificacao | null> {
  const { data, error } = await supabase
    .from('regras_qualificacao')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', regraId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar regra: ${error.message}`)
  }

  return data as RegraQualificacao
}

export async function criarRegra(
  organizacaoId: string,
  payload: CriarRegraPayload,
  criadoPor?: string
): Promise<RegraQualificacao> {
  // Buscar proxima prioridade
  const { data: ultimaRegra } = await supabase
    .from('regras_qualificacao')
    .select('prioridade')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('prioridade', { ascending: false })
    .limit(1)
    .single()

  const novaPrioridade = ultimaRegra ? ultimaRegra.prioridade + 1 : 1

  const { data, error } = await supabase
    .from('regras_qualificacao')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      prioridade: novaPrioridade,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar regra: ${error.message}`)
  }

  return data as RegraQualificacao
}

export async function atualizarRegra(
  organizacaoId: string,
  regraId: string,
  payload: AtualizarRegraPayload
): Promise<RegraQualificacao> {
  const { data, error } = await supabase
    .from('regras_qualificacao')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', regraId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar regra: ${error.message}`)
  }

  return data as RegraQualificacao
}

export async function excluirRegra(
  organizacaoId: string,
  regraId: string
): Promise<void> {
  const { error } = await supabase
    .from('regras_qualificacao')
    .update({
      deletado_em: new Date().toISOString(),
      ativa: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', regraId)

  if (error) {
    throw new Error(`Erro ao excluir regra: ${error.message}`)
  }
}

export async function reordenarRegras(
  organizacaoId: string,
  prioridades: Array<{ id: string; prioridade: number }>
): Promise<void> {
  const updates = prioridades.map(({ id, prioridade }) =>
    supabase
      .from('regras_qualificacao')
      .update({ prioridade, atualizado_em: new Date().toISOString() })
      .eq('organizacao_id', organizacaoId)
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  const erros = results.filter((r) => r.error)
  if (erros.length > 0) {
    throw new Error('Erro ao reordenar regras')
  }
}

// =====================================================
// AVALIACAO DE REGRAS (MQL)
// =====================================================

interface DadosContato {
  [key: string]: unknown
}

export async function avaliarQualificacao(
  organizacaoId: string,
  dadosContato: DadosContato
): Promise<{ qualificado: boolean; regrasAplicadas: string[] }> {
  const { regras } = await listarRegras(organizacaoId, { ativa: true })

  const regrasAplicadas: string[] = []
  let qualificado = false

  for (const regra of regras) {
    // AIDEV-NOTE: Cada regra tem um unico campo_id/operador/valor na estrutura atual
    // Convertemos para a estrutura de condicao unica
    const condicao: Condicao = {
      campo: regra.campo_id || '',
      operador: regra.operador,
      valor: regra.valores?.length ? regra.valores : regra.valor,
    }

    const passou = avaliarCondicaoUnica(dadosContato, condicao)

    if (passou) {
      regrasAplicadas.push(regra.nome)
      // AIDEV-NOTE: Se a regra passa, considera qualificado (nao ha campo acao_qualificar na tabela)
      qualificado = true
    }
  }

  return { qualificado, regrasAplicadas }
}

interface Condicao {
  campo: string
  operador: string
  valor: unknown
}

// AIDEV-NOTE: Avalia uma unica condicao (estrutura atual da tabela regras_qualificacao)
function avaliarCondicaoUnica(dados: DadosContato, condicao: Condicao): boolean {
  const valorCampo = dados[condicao.campo]
  const valorEsperado = condicao.valor

  switch (condicao.operador) {
    case 'igual':
      // Se valor esperado for array, verifica se o campo esta em algum dos valores
      if (Array.isArray(valorEsperado)) {
        return valorEsperado.includes(valorCampo)
      }
      return valorCampo === valorEsperado
    case 'diferente':
      if (Array.isArray(valorEsperado)) {
        return !valorEsperado.includes(valorCampo)
      }
      return valorCampo !== valorEsperado
    case 'contem':
      return String(valorCampo || '').toLowerCase().includes(String(valorEsperado).toLowerCase())
    case 'nao_contem':
      return !String(valorCampo || '').toLowerCase().includes(String(valorEsperado).toLowerCase())
    case 'maior_que':
      return Number(valorCampo) > Number(valorEsperado)
    case 'menor_que':
      return Number(valorCampo) < Number(valorEsperado)
    case 'maior_igual':
      return Number(valorCampo) >= Number(valorEsperado)
    case 'menor_igual':
      return Number(valorCampo) <= Number(valorEsperado)
    case 'vazio':
      return valorCampo === null || valorCampo === undefined || valorCampo === ''
    case 'nao_vazio':
      return valorCampo !== null && valorCampo !== undefined && valorCampo !== ''
    default:
      return false
  }
}

// =====================================================
// CONFIGURACAO DO CARD KANBAN
// =====================================================

export async function buscarConfigCard(
  organizacaoId: string
): Promise<ConfiguracaoCard | null> {
  const { data, error } = await supabase
    .from('configuracoes_card')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar configuracao do card: ${error.message}`)
  }

  return data as ConfiguracaoCard
}

export async function atualizarConfigCard(
  organizacaoId: string,
  payload: AtualizarConfigCardPayload,
  atualizadoPor?: string
): Promise<ConfiguracaoCard> {
  // Verificar se ja existe configuracao
  const configExistente = await buscarConfigCard(organizacaoId)

  if (configExistente) {
    // Atualizar
    const { data, error } = await supabase
      .from('configuracoes_card')
      .update({
        ...payload,
        atualizado_por: atualizadoPor,
        atualizado_em: new Date().toISOString(),
      })
      .eq('organizacao_id', organizacaoId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar configuracao do card: ${error.message}`)
    }

    return data as ConfiguracaoCard
  } else {
    // Criar
    const { data, error } = await supabase
      .from('configuracoes_card')
      .insert({
        organizacao_id: organizacaoId,
        ...payload,
        atualizado_por: atualizadoPor,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar configuracao do card: ${error.message}`)
    }

    return data as ConfiguracaoCard
  }
}

export default {
  // Regras
  listarRegras,
  buscarRegra,
  criarRegra,
  atualizarRegra,
  excluirRegra,
  reordenarRegras,
  avaliarQualificacao,
  // Config Card
  buscarConfigCard,
  atualizarConfigCard,
}
