/**
 * AIDEV-NOTE: Service para Templates de Etapas de Funil
 * Conforme PRD-05 - Templates de Etapas com Tarefas Automaticas
 */

import { supabaseAdmin } from '../config/supabase'

const supabase = supabaseAdmin
import type {
  EtapaTemplate,
  EtapaTemplateComTarefas,
  CriarEtapaTemplatePayload,
  AtualizarEtapaTemplatePayload,
  ListaEtapasTemplatesResponse,
  TipoEtapa,
} from '../schemas/etapas-templates'

// =====================================================
// Listar Templates de Etapas
// =====================================================

export async function listarEtapasTemplates(
  organizacaoId: string,
  filtros?: {
    tipo?: TipoEtapa
    ativo?: boolean
  }
): Promise<ListaEtapasTemplatesResponse> {
  const { tipo, ativo } = filtros || {}

  let query = supabase
    .from('etapas_templates')
    .select(
      `
      *,
      tarefas:etapas_tarefas(
        id,
        tarefa_template_id,
        dias_offset,
        obrigatoria,
        ordem,
        tarefa:tarefas_templates(id, nome, tipo, descricao)
      )
    `,
      { count: 'exact' }
    )
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo)
  }

  const { data, error, count } = await query.order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar templates de etapas: ${error.message}`)
  }

  return {
    templates: data as EtapaTemplateComTarefas[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Template de Etapa por ID
// =====================================================

export async function buscarEtapaTemplate(
  organizacaoId: string,
  templateId: string
): Promise<EtapaTemplateComTarefas | null> {
  const { data, error } = await supabase
    .from('etapas_templates')
    .select(
      `
      *,
      tarefas:etapas_tarefas(
        id,
        tarefa_template_id,
        dias_offset,
        obrigatoria,
        ordem,
        tarefa:tarefas_templates(id, nome, tipo, descricao)
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar template de etapa: ${error.message}`)
  }

  return data as EtapaTemplateComTarefas
}

// =====================================================
// Criar Template de Etapa
// =====================================================

export async function criarEtapaTemplate(
  organizacaoId: string,
  payload: CriarEtapaTemplatePayload,
  criadoPor?: string
): Promise<EtapaTemplate> {
  const { tarefas_ids, ...etapaData } = payload

  // Buscar proxima ordem
  const { data: ultimaEtapa } = await supabase
    .from('etapas_templates')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .is('deletado_em', null)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 0

  // Criar etapa
  const { data: etapa, error } = await supabase
    .from('etapas_templates')
    .insert({
      organizacao_id: organizacaoId,
      ...etapaData,
      ordem: novaOrdem,
      sistema: false,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar template de etapa: ${error.message}`)
  }

  // Vincular tarefas se houver
  if (tarefas_ids && tarefas_ids.length > 0) {
    const tarefasVinculos = tarefas_ids.map((tarefaId, index) => ({
      etapa_template_id: etapa.id,
      tarefa_template_id: tarefaId,
      ordem: index,
      dias_offset: 0,
      obrigatoria: false,
    }))

    const { error: tarefasError } = await supabase
      .from('etapas_tarefas')
      .insert(tarefasVinculos)

    if (tarefasError) {
      // Rollback: excluir etapa criada
      await supabase.from('etapas_templates').delete().eq('id', etapa.id)
      throw new Error(`Erro ao vincular tarefas: ${tarefasError.message}`)
    }
  }

  return etapa as EtapaTemplate
}

// =====================================================
// Atualizar Template de Etapa
// =====================================================

export async function atualizarEtapaTemplate(
  organizacaoId: string,
  templateId: string,
  payload: AtualizarEtapaTemplatePayload
): Promise<EtapaTemplate> {
  // Verificar se template existe e nao e do sistema
  const templateExistente = await buscarEtapaTemplate(organizacaoId, templateId)

  if (!templateExistente) {
    throw new Error('Template de etapa nao encontrado')
  }

  if (templateExistente.sistema) {
    throw new Error('Templates do sistema nao podem ser alterados')
  }

  const { tarefas_ids, ...etapaData } = payload

  // Atualizar etapa
  const { data, error } = await supabase
    .from('etapas_templates')
    .update({
      ...etapaData,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar template de etapa: ${error.message}`)
  }

  // Se tarefas_ids foi passado, recriar vinculos
  if (tarefas_ids !== undefined) {
    // Remover vinculos antigos
    await supabase.from('etapas_tarefas').delete().eq('etapa_template_id', templateId)

    // Criar novos vinculos
    if (tarefas_ids.length > 0) {
      const tarefasVinculos = tarefas_ids.map((tarefaId, index) => ({
        etapa_template_id: templateId,
        tarefa_template_id: tarefaId,
        ordem: index,
        dias_offset: 0,
        obrigatoria: false,
      }))

      await supabase.from('etapas_tarefas').insert(tarefasVinculos)
    }
  }

  return data as EtapaTemplate
}

// =====================================================
// Excluir Template de Etapa (Soft Delete)
// =====================================================

export async function excluirEtapaTemplate(
  organizacaoId: string,
  templateId: string
): Promise<void> {
  // Verificar se template existe e nao e do sistema
  const templateExistente = await buscarEtapaTemplate(organizacaoId, templateId)

  if (!templateExistente) {
    throw new Error('Template de etapa nao encontrado')
  }

  if (templateExistente.sistema) {
    throw new Error('Templates do sistema nao podem ser excluidos')
  }

  // Remover vinculos de tarefas
  await supabase.from('etapas_tarefas').delete().eq('etapa_template_id', templateId)

  // Soft delete da etapa
  const { error } = await supabase
    .from('etapas_templates')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', templateId)

  if (error) {
    throw new Error(`Erro ao excluir template de etapa: ${error.message}`)
  }
}

// =====================================================
// Reordenar Templates de Etapas
// =====================================================

export async function reordenarEtapasTemplates(
  organizacaoId: string,
  ordens: Array<{ id: string; ordem: number }>
): Promise<void> {
  const updates = ordens.map(({ id, ordem }) =>
    supabase
      .from('etapas_templates')
      .update({ ordem, atualizado_em: new Date().toISOString() })
      .eq('organizacao_id', organizacaoId)
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  const erros = results.filter((r) => r.error)
  if (erros.length > 0) {
    throw new Error('Erro ao reordenar templates de etapas')
  }
}

// =====================================================
// Gerenciar Tarefas da Etapa
// =====================================================

export async function vincularTarefaEtapa(
  etapaTemplateId: string,
  tarefaTemplateId: string,
  config?: {
    diasOffset?: number
    obrigatoria?: boolean
    ordem?: number
  }
): Promise<void> {
  const { diasOffset = 0, obrigatoria = false, ordem = 0 } = config || {}

  const { error } = await supabase.from('etapas_tarefas').insert({
    etapa_template_id: etapaTemplateId,
    tarefa_template_id: tarefaTemplateId,
    dias_offset: diasOffset,
    obrigatoria,
    ordem,
  })

  if (error) {
    throw new Error(`Erro ao vincular tarefa: ${error.message}`)
  }
}

export async function desvincularTarefaEtapa(
  etapaTemplateId: string,
  tarefaTemplateId: string
): Promise<void> {
  const { error } = await supabase
    .from('etapas_tarefas')
    .delete()
    .eq('etapa_template_id', etapaTemplateId)
    .eq('tarefa_template_id', tarefaTemplateId)

  if (error) {
    throw new Error(`Erro ao desvincular tarefa: ${error.message}`)
  }
}

export default {
  listarEtapasTemplates,
  buscarEtapaTemplate,
  criarEtapaTemplate,
  atualizarEtapaTemplate,
  excluirEtapaTemplate,
  reordenarEtapasTemplates,
  vincularTarefaEtapa,
  desvincularTarefaEtapa,
}
