/**
 * AIDEV-NOTE: Service para A/B Testing de Formularios (Etapa 4)
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  TesteAB,
  CriarTesteABPayload,
  AtualizarTesteABPayload,
  VarianteAB,
  CriarVarianteABPayload,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

async function verificarFormulario(organizacaoId: string, formularioId: string): Promise<any> {
  const { data, error } = await supabase
    .from('formularios')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()
  if (error || !data) throw new Error('Formulario nao encontrado')
  return data
}

// =====================================================
// TESTES A/B
// =====================================================

export async function listarTestesAB(
  organizacaoId: string,
  formularioId: string
): Promise<TesteAB[]> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('organizacao_id', organizacaoId)
    .order('criado_em', { ascending: false })

  if (error) throw new Error(`Erro ao listar testes AB: ${error.message}`)
  return data as TesteAB[]
}

export async function buscarTesteAB(
  organizacaoId: string,
  formularioId: string,
  testeId: string
): Promise<TesteAB | null> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .eq('organizacao_id', organizacaoId)
    .eq('id', testeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar teste AB: ${error.message}`)
  }
  return data as TesteAB
}

export async function criarTesteAB(
  organizacaoId: string,
  formularioId: string,
  payload: CriarTesteABPayload,
  criadoPor?: string
): Promise<TesteAB> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .insert({
      formulario_id: formularioId,
      organizacao_id: organizacaoId,
      ...payload,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar teste AB: ${error.message}`)
  return data as TesteAB
}

export async function atualizarTesteAB(
  organizacaoId: string,
  formularioId: string,
  testeId: string,
  payload: AtualizarTesteABPayload
): Promise<TesteAB> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({ ...payload, atualizado_em: new Date().toISOString() })
    .eq('id', testeId)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar teste AB: ${error.message}`)
  return data as TesteAB
}

export async function iniciarTesteAB(
  organizacaoId: string,
  formularioId: string,
  testeId: string
): Promise<TesteAB> {
  await verificarFormulario(organizacaoId, formularioId)

  // Verificar se tem pelo menos 2 variantes
  const { count } = await supabase
    .from('variantes_ab_formularios')
    .select('*', { count: 'exact', head: true })
    .eq('teste_ab_id', testeId)

  if (!count || count < 2) throw new Error('Teste AB precisa de pelo menos 2 variantes')

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({
      status: 'em_andamento',
      iniciado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', testeId)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao iniciar teste AB: ${error.message}`)

  // Atualizar formulario com teste atual
  await supabase
    .from('formularios')
    .update({ ab_testing_ativo: true, teste_ab_atual_id: testeId })
    .eq('id', formularioId)

  return data as TesteAB
}

export async function pausarTesteAB(
  organizacaoId: string,
  formularioId: string,
  testeId: string
): Promise<TesteAB> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({
      status: 'pausado',
      pausado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', testeId)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao pausar teste AB: ${error.message}`)
  return data as TesteAB
}

export async function concluirTesteAB(
  organizacaoId: string,
  formularioId: string,
  testeId: string
): Promise<TesteAB> {
  await verificarFormulario(organizacaoId, formularioId)

  // Buscar variante vencedora (maior taxa de conversao)
  const { data: variantes } = await supabase
    .from('variantes_ab_formularios')
    .select('*')
    .eq('teste_ab_id', testeId)
    .order('taxa_conversao', { ascending: false })

  const vencedoraId = variantes && variantes.length > 0 ? variantes[0].id : null

  const { data, error } = await supabase
    .from('testes_ab_formularios')
    .update({
      status: 'concluido',
      concluido_em: new Date().toISOString(),
      variante_vencedora_id: vencedoraId,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', testeId)
    .eq('organizacao_id', organizacaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao concluir teste AB: ${error.message}`)

  // Desativar AB testing no formulario
  await supabase
    .from('formularios')
    .update({ ab_testing_ativo: false, teste_ab_atual_id: null })
    .eq('id', formularioId)

  return data as TesteAB
}

// =====================================================
// VARIANTES
// =====================================================

export async function listarVariantes(testeId: string): Promise<VarianteAB[]> {
  const { data, error } = await supabase
    .from('variantes_ab_formularios')
    .select('*')
    .eq('teste_ab_id', testeId)
    .order('letra_variante', { ascending: true })

  if (error) throw new Error(`Erro ao listar variantes: ${error.message}`)
  return data as VarianteAB[]
}

export async function criarVariante(
  testeId: string,
  payload: CriarVarianteABPayload
): Promise<VarianteAB> {
  const { data, error } = await supabase
    .from('variantes_ab_formularios')
    .insert({ teste_ab_id: testeId, ...payload })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar variante: ${error.message}`)
  return data as VarianteAB
}

export async function resultadosTesteAB(testeId: string) {
  const variantes = await listarVariantes(testeId)
  const totalVisualizacoes = variantes.reduce((s, v) => s + v.contagem_visualizacoes, 0)
  const totalSubmissoes = variantes.reduce((s, v) => s + v.contagem_submissoes, 0)

  return {
    teste_id: testeId,
    total_visualizacoes: totalVisualizacoes,
    total_submissoes: totalSubmissoes,
    variantes: variantes.map((v) => ({
      ...v,
      taxa_conversao_calculada: v.contagem_visualizacoes > 0
        ? (v.contagem_submissoes / v.contagem_visualizacoes) * 100
        : 0,
    })),
  }
}

export default {
  listarTestesAB,
  buscarTesteAB,
  criarTesteAB,
  atualizarTesteAB,
  iniciarTesteAB,
  pausarTesteAB,
  concluirTesteAB,
  listarVariantes,
  criarVariante,
  resultadosTesteAB,
}
