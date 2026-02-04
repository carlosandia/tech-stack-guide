/**
 * AIDEV-NOTE: Service para Templates de Tarefas
 * Conforme PRD-05 - Templates de Tarefas Padronizadas
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  TarefaTemplate,
  CriarTarefaTemplatePayload,
  AtualizarTarefaTemplatePayload,
  ListaTarefasTemplatesResponse,
  TipoTarefa,
} from '../schemas/tarefas-templates'

// =====================================================
// Listar Templates de Tarefas
// =====================================================

export async function listarTarefasTemplates(
  organizacaoId: string,
  filtros?: {
    tipo?: TipoTarefa
    ativo?: boolean
  }
): Promise<ListaTarefasTemplatesResponse> {
  const { tipo, ativo } = filtros || {}

  let query = supabase
    .from('tarefas_templates')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo)
  }

  const { data, error, count } = await query.order('nome', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar templates: ${error.message}`)
  }

  return {
    templates: data as TarefaTemplate[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Template por ID
// =====================================================

export async function buscarTarefaTemplate(
  organizacaoId: string,
  templateId: string
): Promise<TarefaTemplate | null> {
  const { data, error } = await supabase
    .from('tarefas_templates')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar template: ${error.message}`)
  }

  return data as TarefaTemplate
}

// =====================================================
// Criar Template
// =====================================================

export async function criarTarefaTemplate(
  organizacaoId: string,
  payload: CriarTarefaTemplatePayload,
  criadoPor?: string
): Promise<TarefaTemplate> {
  const { data, error } = await supabase
    .from('tarefas_templates')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      is_sistema: false,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar template: ${error.message}`)
  }

  return data as TarefaTemplate
}

// =====================================================
// Atualizar Template
// =====================================================

export async function atualizarTarefaTemplate(
  organizacaoId: string,
  templateId: string,
  payload: AtualizarTarefaTemplatePayload
): Promise<TarefaTemplate> {
  // Verificar se template existe
  const templateExistente = await buscarTarefaTemplate(organizacaoId, templateId)

  if (!templateExistente) {
    throw new Error('Template nao encontrado')
  }

  // AIDEV-NOTE: Campo is_sistema nao existe na tabela tarefas_templates
  // Se necessario, adicionar via migration futura

  const { data, error } = await supabase
    .from('tarefas_templates')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar template: ${error.message}`)
  }

  return data as TarefaTemplate
}

// =====================================================
// Excluir Template (Soft Delete)
// =====================================================

export async function excluirTarefaTemplate(
  organizacaoId: string,
  templateId: string
): Promise<void> {
  // Verificar se template existe
  const templateExistente = await buscarTarefaTemplate(organizacaoId, templateId)

  if (!templateExistente) {
    throw new Error('Template nao encontrado')
  }

  // AIDEV-NOTE: Campo is_sistema nao existe na tabela tarefas_templates
  // Se necessario, adicionar via migration futura

  const { error } = await supabase
    .from('tarefas_templates')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)

  if (error) {
    throw new Error(`Erro ao excluir template: ${error.message}`)
  }
}

export default {
  listarTarefasTemplates,
  buscarTarefaTemplate,
  criarTarefaTemplate,
  atualizarTarefaTemplate,
  excluirTarefaTemplate,
}
