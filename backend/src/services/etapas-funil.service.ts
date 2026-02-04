/**
 * AIDEV-NOTE: Service para Etapas de Funil
 * Conforme PRD-07 - Modulo de Negocios
 *
 * Etapas sao as colunas do Kanban.
 * Tipos: entrada, normal, ganho, perda
 */

import { supabaseAdmin } from '../config/supabase'
import type {
  EtapaFunil,
  CriarEtapaFunilPayload,
  AtualizarEtapaFunilPayload,
  ReordenarEtapasPayload,
  VincularTarefaEtapaPayload,
} from '../schemas/etapas-funil'

const supabase = supabaseAdmin

// =====================================================
// Listar Etapas do Funil
// =====================================================

export async function listarEtapas(
  organizacaoId: string,
  funilId: string
): Promise<EtapaFunil[]> {
  const { data, error } = await supabase
    .from('etapas_funil')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar etapas: ${error.message}`)
  }

  return data as EtapaFunil[]
}

// =====================================================
// Buscar Etapa por ID
// =====================================================

export async function buscarEtapa(
  organizacaoId: string,
  etapaId: string
): Promise<EtapaFunil | null> {
  const { data, error } = await supabase
    .from('etapas_funil')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('id', etapaId)
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar etapa: ${error.message}`)
  }

  return data as EtapaFunil
}

// =====================================================
// Buscar Etapa de Entrada do Funil
// =====================================================

export async function buscarEtapaEntrada(
  organizacaoId: string,
  funilId: string
): Promise<EtapaFunil | null> {
  const { data, error } = await supabase
    .from('etapas_funil')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .eq('tipo', 'entrada')
    .is('deletado_em', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar etapa de entrada: ${error.message}`)
  }

  return data as EtapaFunil
}

// =====================================================
// Criar Etapa
// =====================================================

export async function criarEtapa(
  organizacaoId: string,
  funilId: string,
  payload: CriarEtapaFunilPayload
): Promise<EtapaFunil> {
  // Validar tipo unico (entrada, ganho, perda)
  if (['entrada', 'ganho', 'perda'].includes(payload.tipo)) {
    const { data: existente } = await supabase
      .from('etapas_funil')
      .select('id')
      .eq('organizacao_id', organizacaoId)
      .eq('funil_id', funilId)
      .eq('tipo', payload.tipo)
      .is('deletado_em', null)
      .single()

    if (existente) {
      throw new Error(`Ja existe uma etapa do tipo "${payload.tipo}" neste funil`)
    }
  }

  // Buscar proxima ordem
  const { data: ultimaEtapa } = await supabase
    .from('etapas_funil')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .eq('funil_id', funilId)
    .is('deletado_em', null)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  // Se for ganho/perda, colocar no final
  // Se for normal, colocar antes de ganho/perda
  let novaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 0

  if (payload.tipo === 'normal') {
    // Buscar posicao antes de ganho/perda
    const { data: etapasFinais } = await supabase
      .from('etapas_funil')
      .select('ordem')
      .eq('organizacao_id', organizacaoId)
      .eq('funil_id', funilId)
      .in('tipo', ['ganho', 'perda'])
      .is('deletado_em', null)
      .order('ordem', { ascending: true })
      .limit(1)

    if (etapasFinais && etapasFinais.length > 0) {
      novaOrdem = etapasFinais[0].ordem
      // Incrementar ordem das etapas ganho/perda
      await supabase
        .from('etapas_funil')
        .update({ ordem: supabase.rpc('increment_ordem') })
        .eq('organizacao_id', organizacaoId)
        .eq('funil_id', funilId)
        .gte('ordem', novaOrdem)
        .is('deletado_em', null)
    }
  }

  const { data, error } = await supabase
    .from('etapas_funil')
    .insert({
      organizacao_id: organizacaoId,
      funil_id: funilId,
      nome: payload.nome,
      descricao: payload.descricao,
      tipo: payload.tipo,
      cor: payload.cor || '#6B7280',
      probabilidade: payload.probabilidade ?? 0,
      ordem: novaOrdem,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar etapa: ${error.message}`)
  }

  return data as EtapaFunil
}

// =====================================================
// Atualizar Etapa
// =====================================================

export async function atualizarEtapa(
  organizacaoId: string,
  etapaId: string,
  payload: AtualizarEtapaFunilPayload
): Promise<EtapaFunil> {
  const etapaExistente = await buscarEtapa(organizacaoId, etapaId)
  if (!etapaExistente) {
    throw new Error('Etapa nao encontrada')
  }

  // Nao permitir alterar tipo de etapas especiais
  if (payload.tipo && ['entrada', 'ganho', 'perda'].includes(etapaExistente.tipo)) {
    if (payload.tipo !== etapaExistente.tipo) {
      throw new Error('Nao e permitido alterar o tipo de etapas especiais')
    }
  }

  const { data, error } = await supabase
    .from('etapas_funil')
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', etapaId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar etapa: ${error.message}`)
  }

  return data as EtapaFunil
}

// =====================================================
// Excluir Etapa (Soft Delete)
// =====================================================

export async function excluirEtapa(organizacaoId: string, etapaId: string): Promise<void> {
  const etapaExistente = await buscarEtapa(organizacaoId, etapaId)
  if (!etapaExistente) {
    throw new Error('Etapa nao encontrada')
  }

  // Nao permitir excluir etapas especiais
  if (['entrada', 'ganho', 'perda'].includes(etapaExistente.tipo)) {
    throw new Error(`Etapa do tipo "${etapaExistente.tipo}" nao pode ser excluida`)
  }

  // Verificar se tem oportunidades
  const { count } = await supabase
    .from('oportunidades')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId)
    .eq('etapa_id', etapaId)
    .is('deletado_em', null)

  if (count && count > 0) {
    throw new Error(`Etapa possui ${count} oportunidades. Mova-as antes de excluir.`)
  }

  const { error } = await supabase
    .from('etapas_funil')
    .update({
      deletado_em: new Date().toISOString(),
      ativo: false,
    })
    .eq('organizacao_id', organizacaoId)
    .eq('id', etapaId)

  if (error) {
    throw new Error(`Erro ao excluir etapa: ${error.message}`)
  }
}

// =====================================================
// Reordenar Etapas
// =====================================================

export async function reordenarEtapas(
  organizacaoId: string,
  funilId: string,
  payload: ReordenarEtapasPayload
): Promise<void> {
  // Validar que entrada fica em primeiro e ganho/perda no final
  const etapas = await listarEtapas(organizacaoId, funilId)
  const etapasMap = new Map(etapas.map((e) => [e.id, e]))

  // Criar nova ordenacao usando a estrutura do schema (payload.etapas com id e ordem)
  const novasOrdens = payload.etapas.map((item) => {
    const etapa = etapasMap.get(item.id)
    if (!etapa) {
      throw new Error(`Etapa ${item.id} nao encontrada`)
    }
    return { ...etapa, novaOrdem: item.ordem }
  })

  // Validar restricoes de ordem
  const entrada = novasOrdens.find((e) => e.tipo === 'entrada')
  const ganho = novasOrdens.find((e) => e.tipo === 'ganho')
  const perda = novasOrdens.find((e) => e.tipo === 'perda')

  if (entrada && entrada.novaOrdem !== 0) {
    throw new Error('Etapa de entrada deve ser a primeira')
  }

  const normais = novasOrdens.filter((e) => e.tipo === 'normal')
  const maxNormal = Math.max(...normais.map((e) => e.novaOrdem), -1)

  if (ganho && ganho.novaOrdem <= maxNormal) {
    throw new Error('Etapa de ganho deve estar apos todas as etapas normais')
  }

  if (perda && perda.novaOrdem <= maxNormal) {
    throw new Error('Etapa de perda deve estar apos todas as etapas normais')
  }

  // Aplicar novas ordens
  const updates = novasOrdens.map(({ id, novaOrdem }) =>
    supabase
      .from('etapas_funil')
      .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
      .eq('organizacao_id', organizacaoId)
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const erros = results.filter((r) => r.error)

  if (erros.length > 0) {
    throw new Error('Erro ao reordenar etapas')
  }
}

// =====================================================
// Tarefas Automaticas da Etapa
// =====================================================

export async function listarTarefasEtapa(organizacaoId: string, etapaId: string) {
  const { data, error } = await supabase
    .from('funis_etapas_tarefas')
    .select(
      `
      *,
      tarefa_template:tarefa_template_id (
        id,
        titulo,
        tipo,
        descricao,
        prazo_dias
      )
    `
    )
    .eq('organizacao_id', organizacaoId)
    .eq('etapa_funil_id', etapaId)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar tarefas: ${error.message}`)
  }

  return data
}

export async function vincularTarefa(
  organizacaoId: string,
  etapaId: string,
  payload: VincularTarefaEtapaPayload
): Promise<void> {
  // Buscar proxima ordem
  const { data: ultimaTarefa } = await supabase
    .from('funis_etapas_tarefas')
    .select('ordem')
    .eq('organizacao_id', organizacaoId)
    .eq('etapa_funil_id', etapaId)
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = payload.ordem ?? (ultimaTarefa ? ultimaTarefa.ordem + 1 : 0)

  const { error } = await supabase
    .from('funis_etapas_tarefas')
    .upsert(
      {
        organizacao_id: organizacaoId,
        etapa_funil_id: etapaId,
        tarefa_template_id: payload.tarefa_template_id,
        ordem: novaOrdem,
        ativo: true,
      },
      { onConflict: 'etapa_funil_id,tarefa_template_id' }
    )

  if (error) {
    throw new Error(`Erro ao vincular tarefa: ${error.message}`)
  }
}

export async function desvincularTarefa(
  organizacaoId: string,
  etapaId: string,
  tarefaTemplateId: string
): Promise<void> {
  const { error } = await supabase
    .from('funis_etapas_tarefas')
    .update({ ativo: false })
    .eq('organizacao_id', organizacaoId)
    .eq('etapa_funil_id', etapaId)
    .eq('tarefa_template_id', tarefaTemplateId)

  if (error) {
    throw new Error(`Erro ao desvincular tarefa: ${error.message}`)
  }
}

export default {
  listarEtapas,
  buscarEtapa,
  buscarEtapaEntrada,
  criarEtapa,
  atualizarEtapa,
  excluirEtapa,
  reordenarEtapas,
  listarTarefasEtapa,
  vincularTarefa,
  desvincularTarefa,
}
