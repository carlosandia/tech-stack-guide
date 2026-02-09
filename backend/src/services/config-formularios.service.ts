/**
 * AIDEV-NOTE: Service para Configuracoes de Formularios (Etapa 2)
 * Config Popup, Config Newsletter, Etapas Multi-step
 */

import { supabaseAdmin } from '../config/supabase.js'
import type {
  ConfigPopup,
  AtualizarConfigPopupPayload,
  ConfigNewsletter,
  AtualizarConfigNewsletterPayload,
  EtapaFormulario,
  AtualizarEtapasPayload,
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
// CONFIG POPUP
// =====================================================

export async function buscarConfigPopup(
  organizacaoId: string,
  formularioId: string
): Promise<ConfigPopup | null> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'popup_saida') throw new Error('Formulario nao e do tipo popup_saida')

  const { data, error } = await supabase
    .from('config_popup_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar config popup: ${error.message}`)
  }

  return data as ConfigPopup
}

export async function atualizarConfigPopup(
  organizacaoId: string,
  formularioId: string,
  payload: AtualizarConfigPopupPayload
): Promise<ConfigPopup> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'popup_saida') throw new Error('Formulario nao e do tipo popup_saida')

  // Upsert
  const { data: existente } = await supabase
    .from('config_popup_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .single()

  if (existente) {
    const { data, error } = await supabase
      .from('config_popup_formularios')
      .update(payload)
      .eq('formulario_id', formularioId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar config popup: ${error.message}`)
    return data as ConfigPopup
  }

  const { data, error } = await supabase
    .from('config_popup_formularios')
    .insert({ formulario_id: formularioId, ...payload })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar config popup: ${error.message}`)
  return data as ConfigPopup
}

// =====================================================
// CONFIG NEWSLETTER
// =====================================================

export async function buscarConfigNewsletter(
  organizacaoId: string,
  formularioId: string
): Promise<ConfigNewsletter | null> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'newsletter') throw new Error('Formulario nao e do tipo newsletter')

  const { data, error } = await supabase
    .from('config_newsletter_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar config newsletter: ${error.message}`)
  }

  return data as ConfigNewsletter
}

export async function atualizarConfigNewsletter(
  organizacaoId: string,
  formularioId: string,
  payload: AtualizarConfigNewsletterPayload
): Promise<ConfigNewsletter> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'newsletter') throw new Error('Formulario nao e do tipo newsletter')

  // Upsert
  const { data: existente } = await supabase
    .from('config_newsletter_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .single()

  if (existente) {
    const { data, error } = await supabase
      .from('config_newsletter_formularios')
      .update(payload)
      .eq('formulario_id', formularioId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar config newsletter: ${error.message}`)
    return data as ConfigNewsletter
  }

  const { data, error } = await supabase
    .from('config_newsletter_formularios')
    .insert({ formulario_id: formularioId, ...payload })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar config newsletter: ${error.message}`)
  return data as ConfigNewsletter
}

// =====================================================
// ETAPAS (Multi-step)
// =====================================================

export async function listarEtapas(
  organizacaoId: string,
  formularioId: string
): Promise<EtapaFormulario[]> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'multi_etapas') throw new Error('Formulario nao e do tipo multi_etapas')

  const { data, error } = await supabase
    .from('etapas_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .order('indice_etapa', { ascending: true })

  if (error) throw new Error(`Erro ao listar etapas: ${error.message}`)

  return data as EtapaFormulario[]
}

export async function atualizarEtapas(
  organizacaoId: string,
  formularioId: string,
  payload: AtualizarEtapasPayload
): Promise<EtapaFormulario[]> {
  const form = await verificarFormulario(organizacaoId, formularioId)
  if (form.tipo !== 'multi_etapas') throw new Error('Formulario nao e do tipo multi_etapas')

  // Deletar etapas existentes e recriar (bulk update)
  await supabase
    .from('etapas_formularios')
    .delete()
    .eq('formulario_id', formularioId)

  if (payload.etapas.length === 0) return []

  const novasEtapas = payload.etapas.map((etapa) => ({
    formulario_id: formularioId,
    indice_etapa: etapa.indice_etapa,
    titulo_etapa: etapa.titulo_etapa,
    descricao_etapa: etapa.descricao_etapa,
    icone_etapa: etapa.icone_etapa,
    validar_ao_avancar: etapa.validar_ao_avancar ?? true,
    texto_botao_proximo: etapa.texto_botao_proximo || 'Proximo',
    texto_botao_anterior: etapa.texto_botao_anterior || 'Voltar',
    texto_botao_enviar: etapa.texto_botao_enviar || 'Enviar',
  }))

  const { data, error } = await supabase
    .from('etapas_formularios')
    .insert(novasEtapas)
    .select()
    .order('indice_etapa', { ascending: true })

  if (error) throw new Error(`Erro ao atualizar etapas: ${error.message}`)

  return data as EtapaFormulario[]
}

export default {
  buscarConfigPopup,
  atualizarConfigPopup,
  buscarConfigNewsletter,
  atualizarConfigNewsletter,
  listarEtapas,
  atualizarEtapas,
}
