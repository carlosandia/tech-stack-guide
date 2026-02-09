/**
 * AIDEV-NOTE: Service para Campos de Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 * CRUD campos + reordenacao
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  CampoFormulario,
  CriarCampoPayload,
  AtualizarCampoPayload,
  ReordenarCamposPayload,
} from '../schemas/formularios.js'

const supabase = supabaseAdmin

// =====================================================
// Verificar propriedade do formulario
// =====================================================

async function verificarFormulario(organizacaoId: string, formularioId: string): Promise<void> {
  const { data, error } = await supabase
    .from('formularios')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('id', formularioId)
    .is('deletado_em', null)
    .single()

  if (error || !data) {
    throw new Error('Formulario nao encontrado')
  }
}

// =====================================================
// Listar Campos
// =====================================================

export async function listarCampos(
  organizacaoId: string,
  formularioId: string
): Promise<CampoFormulario[]> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('campos_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('ordem', { ascending: true })

  if (error) throw new Error(`Erro ao listar campos: ${error.message}`)

  return data as CampoFormulario[]
}

// =====================================================
// Criar Campo
// =====================================================

export async function criarCampo(
  organizacaoId: string,
  formularioId: string,
  payload: CriarCampoPayload
): Promise<CampoFormulario> {
  await verificarFormulario(organizacaoId, formularioId)

  // Calcular ordem se nao fornecida
  let ordem = payload.ordem
  if (ordem === undefined) {
    const { data: ultimo } = await supabase
      .from('campos_formularios')
      .select('ordem')
      .eq('formulario_id', formularioId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    ordem = ultimo ? ultimo.ordem + 1 : 0
  }

  const { data, error } = await supabase
    .from('campos_formularios')
    .insert({
      formulario_id: formularioId,
      nome: payload.nome,
      label: payload.label,
      placeholder: payload.placeholder,
      texto_ajuda: payload.texto_ajuda,
      tipo: payload.tipo || 'texto',
      obrigatorio: payload.obrigatorio ?? false,
      validacoes: payload.validacoes || {},
      opcoes: payload.opcoes || [],
      mapeamento_campo: payload.mapeamento_campo,
      largura: payload.largura || 'full',
      ordem,
      condicional_ativo: payload.condicional_ativo ?? false,
      condicional_campo_id: payload.condicional_campo_id,
      condicional_operador: payload.condicional_operador,
      condicional_valor: payload.condicional_valor,
      etapa_numero: payload.etapa_numero || 1,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar campo: ${error.message}`)

  return data as CampoFormulario
}

// =====================================================
// Atualizar Campo
// =====================================================

export async function atualizarCampo(
  organizacaoId: string,
  formularioId: string,
  campoId: string,
  payload: AtualizarCampoPayload
): Promise<CampoFormulario> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('campos_formularios')
    .update(payload)
    .eq('formulario_id', formularioId)
    .eq('id', campoId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Campo nao encontrado')
    throw new Error(`Erro ao atualizar campo: ${error.message}`)
  }

  return data as CampoFormulario
}

// =====================================================
// Excluir Campo
// =====================================================

export async function excluirCampo(
  organizacaoId: string,
  formularioId: string,
  campoId: string
): Promise<void> {
  await verificarFormulario(organizacaoId, formularioId)

  const { error } = await supabase
    .from('campos_formularios')
    .delete()
    .eq('formulario_id', formularioId)
    .eq('id', campoId)

  if (error) throw new Error(`Erro ao excluir campo: ${error.message}`)
}

// =====================================================
// Reordenar Campos
// =====================================================

export async function reordenarCampos(
  organizacaoId: string,
  formularioId: string,
  payload: ReordenarCamposPayload
): Promise<void> {
  await verificarFormulario(organizacaoId, formularioId)

  // Atualizar ordem de cada campo
  for (const item of payload.campos) {
    const { error } = await supabase
      .from('campos_formularios')
      .update({ ordem: item.ordem })
      .eq('formulario_id', formularioId)
      .eq('id', item.id)

    if (error) throw new Error(`Erro ao reordenar campo ${item.id}: ${error.message}`)
  }
}

export default {
  listarCampos,
  criarCampo,
  atualizarCampo,
  excluirCampo,
  reordenarCampos,
}
