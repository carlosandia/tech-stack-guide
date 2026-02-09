/**
 * AIDEV-NOTE: Service para Analytics de Formularios (Etapa 4)
 * Eventos granulares e metricas agregadas
 */

import { supabaseAdmin } from '../config/supabase.js'
import type { RegistrarEventoPayload } from '../schemas/formularios.js'

const supabase = supabaseAdmin

// =====================================================
// REGISTRAR EVENTO
// =====================================================

export async function registrarEvento(
  formularioId: string,
  payload: RegistrarEventoPayload
): Promise<void> {
  const { error } = await supabase
    .from('eventos_analytics_formularios')
    .insert({
      formulario_id: formularioId,
      ...payload,
    })

  if (error) {
    console.error('Erro ao registrar evento analytics:', error.message)
    // Nao lanca erro para nao bloquear fluxo principal
  }
}

// =====================================================
// METRICAS GERAIS
// =====================================================

export async function obterMetricas(
  organizacaoId: string,
  formularioId: string,
  filtros?: { data_inicio?: string; data_fim?: string }
): Promise<Record<string, unknown>> {
  // Buscar formulario
  const { data: form } = await supabase
    .from('formularios')
    .select('total_visualizacoes, total_submissoes, taxa_conversao')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .single()

  if (!form) throw new Error('Formulario nao encontrado')

  // Eventos por tipo
  let query = supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento')
    .eq('formulario_id', formularioId)

  if (filtros?.data_inicio) query = query.gte('criado_em', filtros.data_inicio)
  if (filtros?.data_fim) query = query.lte('criado_em', filtros.data_fim)

  const { data: eventos } = await query

  const contagemPorTipo: Record<string, number> = {}
  if (eventos) {
    for (const e of eventos) {
      contagemPorTipo[e.tipo_evento] = (contagemPorTipo[e.tipo_evento] || 0) + 1
    }
  }

  return {
    total_visualizacoes: form.total_visualizacoes,
    total_submissoes: form.total_submissoes,
    taxa_conversao: form.taxa_conversao,
    eventos_por_tipo: contagemPorTipo,
    total_abandonos: contagemPorTipo['abandono'] || 0,
    total_inicios: contagemPorTipo['inicio'] || 0,
  }
}

// =====================================================
// FUNIL DE CONVERSAO
// =====================================================

export async function obterFunilConversao(
  organizacaoId: string,
  formularioId: string
): Promise<Record<string, unknown>> {
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento')
    .eq('formulario_id', formularioId)

  if (!eventos) return { etapas: [] }

  const contagem: Record<string, number> = {}
  for (const e of eventos) {
    contagem[e.tipo_evento] = (contagem[e.tipo_evento] || 0) + 1
  }

  const etapasFunil = [
    { nome: 'Visualizacao', valor: contagem['visualizacao'] || 0 },
    { nome: 'Inicio', valor: contagem['inicio'] || 0 },
    { nome: 'Submissao', valor: contagem['submissao'] || 0 },
  ]

  return { etapas: etapasFunil }
}

// =====================================================
// DESEMPENHO POR CAMPO
// =====================================================

export async function obterDesempenhoCampos(
  organizacaoId: string,
  formularioId: string
): Promise<any[]> {
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento, dados_evento, tempo_no_campo_segundos')
    .eq('formulario_id', formularioId)
    .in('tipo_evento', ['foco_campo', 'saida_campo', 'erro_campo'])

  if (!eventos || eventos.length === 0) return []

  const campos: Record<string, { interacoes: number; erros: number; tempo_total: number }> = {}

  for (const e of eventos) {
    const campoId = (e.dados_evento as any)?.campo_id || 'desconhecido'
    if (!campos[campoId]) campos[campoId] = { interacoes: 0, erros: 0, tempo_total: 0 }

    campos[campoId].interacoes++
    if (e.tipo_evento === 'erro_campo') campos[campoId].erros++
    if (e.tempo_no_campo_segundos) campos[campoId].tempo_total += e.tempo_no_campo_segundos
  }

  return Object.entries(campos).map(([campoId, stats]) => ({
    campo_id: campoId,
    total_interacoes: stats.interacoes,
    total_erros: stats.erros,
    tempo_medio_segundos: stats.interacoes > 0 ? Math.round(stats.tempo_total / stats.interacoes) : 0,
  }))
}

// =====================================================
// TAXA DE ABANDONO
// =====================================================

export async function obterTaxaAbandono(
  organizacaoId: string,
  formularioId: string
): Promise<Record<string, unknown>> {
  const { data: eventos } = await supabase
    .from('eventos_analytics_formularios')
    .select('tipo_evento, dados_evento')
    .eq('formulario_id', formularioId)
    .in('tipo_evento', ['inicio', 'submissao', 'abandono'])

  if (!eventos) return { taxa_abandono: 0 }

  const inicios = eventos.filter((e) => e.tipo_evento === 'inicio').length
  const abandonos = eventos.filter((e) => e.tipo_evento === 'abandono').length
  const submissoes = eventos.filter((e) => e.tipo_evento === 'submissao').length

  return {
    total_inicios: inicios,
    total_abandonos: abandonos,
    total_submissoes: submissoes,
    taxa_abandono: inicios > 0 ? Math.round((abandonos / inicios) * 100 * 100) / 100 : 0,
    taxa_conclusao: inicios > 0 ? Math.round((submissoes / inicios) * 100 * 100) / 100 : 0,
  }
}

// =====================================================
// CONVERSAO POR ORIGEM (UTM)
// =====================================================

export async function obterConversaoPorOrigem(
  organizacaoId: string,
  formularioId: string
): Promise<any[]> {
  const { data: submissoes } = await supabase
    .from('submissoes_formularios')
    .select('utm_source, utm_medium, utm_campaign, status')
    .eq('formulario_id', formularioId)

  if (!submissoes) return []

  const origens: Record<string, { total: number; convertidas: number }> = {}

  for (const s of submissoes) {
    const chave = s.utm_source || 'direto'
    if (!origens[chave]) origens[chave] = { total: 0, convertidas: 0 }
    origens[chave].total++
    if (s.status === 'processada' || s.status === 'nova') origens[chave].convertidas++
  }

  return Object.entries(origens).map(([origem, stats]) => ({
    origem,
    total: stats.total,
    convertidas: stats.convertidas,
    taxa_conversao: stats.total > 0 ? Math.round((stats.convertidas / stats.total) * 100 * 100) / 100 : 0,
  }))
}

export default {
  registrarEvento,
  obterMetricas,
  obterFunilConversao,
  obterDesempenhoCampos,
  obterTaxaAbandono,
  obterConversaoPorOrigem,
}
