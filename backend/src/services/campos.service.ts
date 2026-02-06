/**
 * AIDEV-NOTE: Service para Campos Customizados
 * Conforme PRD-05 - 13 tipos de campos suportados
 *
 * Campos do sistema sao bloqueados para edicao/exclusao
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  CampoCustomizado,
  CriarCampoPayload,
  AtualizarCampoPayload,
  ListaCamposResponse,
} from '../schemas/campos'
import { EntidadeEnum } from '../schemas/campos'

type EntidadeCampo = 'pessoa' | 'empresa' | 'oportunidade'

const supabase = supabaseAdmin

// =====================================================
// Listar Campos por Entidade
// =====================================================

export async function listarCampos(
  organizacaoId: string,
  entidade: EntidadeCampo
): Promise<ListaCamposResponse> {
  const { data, error, count } = await supabase
    .from('campos_customizados')
    .select('*', { count: 'exact' })
    .eq('organizacao_id', organizacaoId)
    .eq('entidade', entidade)
    .is('deletado_em', null)
    .order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar campos: ${error.message}`)
  }

  return {
    campos: data as CampoCustomizado[],
    total: count || 0,
  }
}

// =====================================================
// Buscar Campo por ID
// =====================================================

export async function buscarCampo(
  organizacaoId: string,
  campoId: string
): Promise<CampoCustomizado | null> {
  const { data, error } = await supabase
    .from('campos_customizados')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', campoId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar campo: ${error.message}`)
  }

  return data as CampoCustomizado
}

// =====================================================
// Criar Campo
// =====================================================

export async function criarCampo(
  organizacaoId: string,
  payload: CriarCampoPayload,
  criadoPor?: string
): Promise<CampoCustomizado> {
  // Buscar proxima ordem
  const { data: ultimoCampo } = await supabase
    .from('campos_customizados')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .eq('entidade', payload.entidade)
    .is('deletado_em', null)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = ultimoCampo ? ultimoCampo.ordem + 1 : 0

  const { data, error } = await supabase
    .from('campos_customizados')
    .insert({
      organizacao_id: organizacaoId,
      ...payload,
      ordem: novaOrdem,
      sistema: false,
      criado_por: criadoPor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar campo: ${error.message}`)
  }

  return data as CampoCustomizado
}

// =====================================================
// Atualizar Campo
// =====================================================

export async function atualizarCampo(
  organizacaoId: string,
  campoId: string,
  payload: AtualizarCampoPayload
): Promise<CampoCustomizado> {
  // Verificar se campo existe e nao e do sistema
  const campoExistente = await buscarCampo(organizacaoId, campoId)

  if (!campoExistente) {
    throw new Error('Campo nao encontrado')
  }

  if (campoExistente.sistema) {
    throw new Error('Campos do sistema nao podem ser alterados')
  }

  const { data, error } = await supabase
    .from('campos_customizados')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', campoId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar campo: ${error.message}`)
  }

  return data as CampoCustomizado
}

// =====================================================
// Excluir Campo (Soft Delete)
// =====================================================

export async function excluirCampo(
  organizacaoId: string,
  campoId: string
): Promise<void> {
  // Verificar se campo existe e nao e do sistema
  const campoExistente = await buscarCampo(organizacaoId, campoId)

  if (!campoExistente) {
    throw new Error('Campo nao encontrado')
  }

  if (campoExistente.sistema) {
    throw new Error('Campos do sistema nao podem ser excluidos')
  }

  const { error } = await supabase
    .from('campos_customizados')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', campoId)

  if (error) {
    throw new Error(`Erro ao excluir campo: ${error.message}`)
  }
}

// =====================================================
// Reordenar Campos
// =====================================================

export async function reordenarCampos(
  organizacaoId: string,
  entidade: EntidadeCampo,
  ordens: Array<{ id: string; ordem: number }>
): Promise<void> {
  // Atualizar cada campo com sua nova ordem
  const updates = ordens.map(({ id, ordem }) =>
    supabase
      .from('campos_customizados')
      .update({ ordem, atualizado_em: new Date().toISOString() })
      .eq('organizacao_id', organizacaoId)
      .eq('id', id)
      .eq('entidade', entidade)
  )

  const results = await Promise.all(updates)

  const erros = results.filter((r: { error: unknown }) => r.error)
  if (erros.length > 0) {
    throw new Error('Erro ao reordenar campos')
  }
}

// =====================================================
// Salvar Valor de Campo Customizado
// =====================================================

export async function salvarValorCampo(
  organizacaoId: string,
  campoId: string,
  entidadeId: string,
  valor: unknown
): Promise<void> {
  // Verificar se ja existe valor para este campo/entidade
  const { data: existente } = await supabase
    .from('valores_campos_customizados')
    .select('id')
    .eq('organizacao_id', organizacaoId)
    .eq('campo_id', campoId)
    .eq('entidade_id', entidadeId)
    .single()

  if (existente) {
    // Atualizar valor existente
    const { error } = await supabase
      .from('valores_campos_customizados')
      .update({
        valor,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', existente.id)

    if (error) {
      throw new Error(`Erro ao atualizar valor: ${error.message}`)
    }
  } else {
    // Inserir novo valor
    const { error } = await supabase
      .from('valores_campos_customizados')
      .insert({
        organizacao_id: organizacaoId,
        campo_id: campoId,
        entidade_id: entidadeId,
        valor,
      })

    if (error) {
      throw new Error(`Erro ao salvar valor: ${error.message}`)
    }
  }
}

// =====================================================
// Buscar Valores de Campos para Entidade
// =====================================================

export async function buscarValoresCampos(
  organizacaoId: string,
  entidadeId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('valores_campos_customizados')
    .select('campo_id, valor')
    .eq('organizacao_id', organizacaoId)
    .eq('entidade_id', entidadeId)

  if (error) {
    throw new Error(`Erro ao buscar valores: ${error.message}`)
  }

  // Converter para objeto chave-valor
  return (data || []).reduce(
    (acc: Record<string, unknown>, item: { campo_id: string; valor: unknown }) => ({
      ...acc,
      [item.campo_id]: item.valor,
    }),
    {}
  )
}

export default {
  listarCampos,
  buscarCampo,
  criarCampo,
  atualizarCampo,
  excluirCampo,
  reordenarCampos,
  salvarValorCampo,
  buscarValoresCampos,
}
