/**
 * AIDEV-NOTE: Service para Estilos de Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 * GET/PUT estilos do formulario
 */

import { supabaseAdmin } from '../config/supabase.js'
import type { EstiloFormulario, AtualizarEstiloPayload } from '../schemas/formularios.js'

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
// Buscar Estilos
// =====================================================

export async function buscarEstilos(
  organizacaoId: string,
  formularioId: string
): Promise<EstiloFormulario | null> {
  await verificarFormulario(organizacaoId, formularioId)

  const { data, error } = await supabase
    .from('estilos_formularios')
    .select('*')
    .eq('formulario_id', formularioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar estilos: ${error.message}`)
  }

  return data as EstiloFormulario
}

// =====================================================
// Atualizar Estilos (upsert)
// =====================================================

export async function atualizarEstilos(
  organizacaoId: string,
  formularioId: string,
  payload: AtualizarEstiloPayload
): Promise<EstiloFormulario> {
  await verificarFormulario(organizacaoId, formularioId)

  // Tentar atualizar primeiro
  const { data: existente } = await supabase
    .from('estilos_formularios')
    .select('id')
    .eq('formulario_id', formularioId)
    .single()

  if (existente) {
    const { data, error } = await supabase
      .from('estilos_formularios')
      .update(payload)
      .eq('formulario_id', formularioId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar estilos: ${error.message}`)
    return data as EstiloFormulario
  }

  // Criar se nao existir
  const { data, error } = await supabase
    .from('estilos_formularios')
    .insert({ formulario_id: formularioId, ...payload })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar estilos: ${error.message}`)
  return data as EstiloFormulario
}

export default {
  buscarEstilos,
  atualizarEstilos,
}
