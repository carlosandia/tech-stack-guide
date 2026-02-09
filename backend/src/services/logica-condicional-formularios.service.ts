/**
 * AIDEV-NOTE: Service para Logica Condicional e Progressive Profiling (Etapa 3)
 * Regras condicionais de formularios e config de progressive profiling
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  RegraCondicional,
  CriarRegraCondicionalPayload,
  AtualizarRegraCondicionalPayload,
  ConfigProgressiveProfiling,
  AtualizarConfigProfilingPayload,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

// =====================================================
// Verificar propriedade do formulario
// =====================================================

async function verificarFormulario(organizacaoId: string, formularioId: string): Promise<any> {
  const { data, error } = await supabase
    .from('formularios')
    .select('id, tipo')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()

  if (error || !data) throw new Error('Formulario nao encontrado')
  return data
}

// =====================================================
// REGRAS CONDICIONAIS
// =====================================================

export async function listarRegrasCondicionais(
  organizacaoId: string,
  formularioId: string
): Promise<RegraCondicional[]> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('ordem_regra', { ascending: true })

  if (error) throw new Error(`Erro ao listar regras condicionais: ${error.message}`)
  return data as RegraCondicional[]
}

export async function buscarRegraCondicional(
  organizacaoId: string,
  formularioId: string,
  regraId: string
): Promise<RegraCondicional | null> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('id', regraId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar regra condicional: ${error.message}`)
  }

  return data as RegraCondicional
}

export async function criarRegraCondicional(
  organizacaoId: string,
  formularioId: string,
  payload: CriarRegraCondicionalPayload
): Promise<RegraCondicional> {
  await verificarFormulario(organizacaoId, formularioId)

  // Auto-incrementar ordem se nao fornecida
  if (payload.ordem_regra === 0) {
    const { data: ultima } = await supabase
      .from('regras_condicionais_formularios')
      .select('ordem_regra')
      .eq('formulario_id', formularioId)
      .order('ordem_regra', { ascending: false })
      .limit(1)
      .single()

    payload.ordem_regra = ultima ? ultima.ordem_regra + 1 : 0
  }

  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .insert({
      formulario_id: formularioId,
      ...payload,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar regra condicional: ${error.message}`)
  return data as RegraCondicional
}

export async function atualizarRegraCondicional(
  organizacaoId: string,
  formularioId: string,
  regraId: string,
  payload: AtualizarRegraCondicionalPayload
): Promise<RegraCondicional> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('regras_condicionais_formularios')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('formulario_id', formularioId)
    .eq('id', regraId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar regra condicional: ${error.message}`)
  return data as RegraCondicional
}

export async function excluirRegraCondicional(
  organizacaoId: string,
  formularioId: string,
  regraId: string
): Promise<void> {
  await verificarFormulario(organizacaoId, formularioId)

  const { error } = await supabase
    .from('regras_condicionais_formularios')
    .delete()
    .eq('formulario_id', formularioId)
    .eq('id', regraId)

  if (error) throw new Error(`Erro ao excluir regra condicional: ${error.message}`)
}

export async function reordenarRegrasCondicionais(
  organizacaoId: string,
  formularioId: string,
  regras: Array<{ id: string; ordem_regra: number }>
): Promise<void> {
  await verificarFormulario(organizacaoId, formularioId)

  const updates = regras.map(({ id, ordem_regra }) =>
    supabase
      .from('regras_condicionais_formularios')
      .update({ ordem_regra, atualizado_em: new Date().toISOString() })
      .eq('formulario_id', formularioId)
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const erros = results.filter((r) => r.error)
  if (erros.length > 0) throw new Error('Erro ao reordenar regras condicionais')
}

// =====================================================
// AVALIACAO DE REGRAS CONDICIONAIS (Runtime)
// =====================================================

interface DadosSubmissao {
  [key: string]: unknown
}

export function avaliarRegrasCondicionais(
  regras: RegraCondicional[],
  dados: DadosSubmissao
): Array<{ regraId: string; tipo_acao: string; alvo: string | number | null; valor?: string }> {
  const acoes: Array<{ regraId: string; tipo_acao: string; alvo: string | number | null; valor?: string }> = []

  for (const regra of regras) {
    if (!regra.ativa) continue

    const resultado = avaliarCondicoes(regra.condicoes as any[], dados, regra.logica_condicoes)

    if (resultado) {
      acoes.push({
        regraId: regra.id,
        tipo_acao: regra.tipo_acao,
        alvo: regra.campo_alvo_id || regra.indice_etapa_alvo || regra.url_redirecionamento_alvo || null,
        valor: regra.valor_alvo || undefined,
      })
    }
  }

  return acoes
}

function avaliarCondicoes(
  condicoes: Array<{ campo_id: string; operador: string; valor?: string }>,
  dados: DadosSubmissao,
  logica: string
): boolean {
  if (condicoes.length === 0) return false

  const resultados = condicoes.map((c) => {
    const valorCampo = dados[c.campo_id]
    return avaliarCondicaoUnica(valorCampo, c.operador, c.valor)
  })

  if (logica === 'ou') return resultados.some(Boolean)
  return resultados.every(Boolean) // 'e' (AND)
}

function avaliarCondicaoUnica(valorCampo: unknown, operador: string, valorEsperado?: string): boolean {
  switch (operador) {
    case 'igual':
      return String(valorCampo ?? '') === String(valorEsperado ?? '')
    case 'diferente':
      return String(valorCampo ?? '') !== String(valorEsperado ?? '')
    case 'contem':
      return String(valorCampo ?? '').toLowerCase().includes(String(valorEsperado ?? '').toLowerCase())
    case 'nao_contem':
      return !String(valorCampo ?? '').toLowerCase().includes(String(valorEsperado ?? '').toLowerCase())
    case 'maior_que':
      return Number(valorCampo) > Number(valorEsperado)
    case 'menor_que':
      return Number(valorCampo) < Number(valorEsperado)
    case 'vazio':
      return valorCampo === null || valorCampo === undefined || valorCampo === ''
    case 'nao_vazio':
      return valorCampo !== null && valorCampo !== undefined && valorCampo !== ''
    default:
      return false
  }
}

// =====================================================
// CONFIG PROGRESSIVE PROFILING
// =====================================================

export async function buscarConfigProfiling(
  organizacaoId: string,
  formularioId: string
): Promise<ConfigProgressiveProfiling | null> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('config_progressive_profiling_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar config profiling: ${error.message}`)
  }

  return data as ConfigProgressiveProfiling
}

export async function atualizarConfigProfiling(
  organizacaoId: string,
  formularioId: string,
  payload: AtualizarConfigProfilingPayload
): Promise<ConfigProgressiveProfiling> {
  await verificarFormulario(organizacaoId, formularioId)

  // Upsert
  const { data: existente } = await supabase
    .from('config_progressive_profiling_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .single()

  if (existente) {
    const { data, error } = await supabase
      .from('config_progressive_profiling_formularios')
      .update({
        ...payload,
        atualizado_em: new Date().toISOString(),
      })
      .eq('formulario_id', formularioId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar config profiling: ${error.message}`)
    return data as ConfigProgressiveProfiling
  }

  const { data, error } = await supabase
    .from('config_progressive_profiling_formularios')
    .insert({
      formulario_id: formularioId,
      ...payload,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar config profiling: ${error.message}`)
  return data as ConfigProgressiveProfiling
}

// Atualizar flag no formulario
export async function toggleProgressiveProfiling(
  organizacaoId: string,
  formularioId: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('formularios')
    .update({ progressive_profiling_ativo: ativo, atualizado_em: new Date().toISOString() })
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)

  if (error) throw new Error(`Erro ao atualizar flag profiling: ${error.message}`)
}

export default {
  // Regras condicionais
  listarRegrasCondicionais,
  buscarRegraCondicional,
  criarRegraCondicional,
  atualizarRegraCondicional,
  excluirRegraCondicional,
  reordenarRegrasCondicionais,
  avaliarRegrasCondicionais,
  // Progressive profiling
  buscarConfigProfiling,
  atualizarConfigProfiling,
  toggleProgressiveProfiling,
}
