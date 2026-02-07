/**
 * AIDEV-NOTE: Service API para Configuração de Pipeline
 * Conforme PRD-07 RF-03 a RF-09
 * Usa Supabase client direto (respeita RLS)
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helper
// =====================================================

let _cachedOrgId: string | null = null

async function getOrganizacaoId(): Promise<string> {
  if (_cachedOrgId) return _cachedOrgId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('organizacao_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.organizacao_id) throw new Error('Organização não encontrada')
  _cachedOrgId = data.organizacao_id
  return _cachedOrgId
}

supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
})

// =====================================================
// Types
// =====================================================

export interface EtapaFunil {
  id: string
  organizacao_id: string
  funil_id: string
  nome: string
  descricao?: string | null
  tipo: 'entrada' | 'normal' | 'ganho' | 'perda'
  cor?: string | null
  probabilidade?: number | null
  ordem?: number | null
  ativo?: boolean | null
  criado_em: string
  atualizado_em: string
}

export interface CampoVinculado {
  id: string
  campo_id: string
  funil_id: string
  obrigatorio?: boolean | null
  visivel?: boolean | null
  exibir_card?: boolean | null
  ordem?: number | null
  campo?: {
    id: string
    nome: string
    slug: string
    tipo: string
    entidade: string
    sistema?: boolean | null
    obrigatorio?: boolean | null
  }
}

export interface ConfigDistribuicao {
  id: string
  organizacao_id: string
  funil_id: string
  modo: string
  horario_especifico?: boolean | null
  horario_inicio?: string | null
  horario_fim?: string | null
  dias_semana?: number[] | null
  pular_inativos?: boolean | null
  fallback_manual?: boolean | null
  sla_ativo?: boolean | null
  sla_tempo_minutos?: number | null
  sla_max_redistribuicoes?: number | null
  sla_acao_limite?: string | null
}

export interface RegraQualificacao {
  id: string
  nome: string
  descricao?: string | null
  campo_id?: string | null
  operador: string
  valor?: string | null
  valores?: unknown | null
  ativo?: boolean | null
  campo?: {
    id: string
    nome: string
    slug: string
  } | null
}

export interface MotivoResultado {
  id: string
  nome: string
  descricao?: string | null
  tipo: string
  cor?: string | null
  ativo?: boolean | null
  padrao?: boolean | null
}

export interface TarefaTemplate {
  id: string
  titulo: string
  tipo?: string | null
  descricao?: string | null
}

export interface EtapaTarefaVinculo {
  id: string
  etapa_funil_id: string
  tarefa_template_id: string
  ativo?: boolean | null
  ordem?: number | null
  tarefa?: TarefaTemplate | null
}

// =====================================================
// API
// =====================================================

export const pipelineConfigApi = {
  // =====================================================
  // Etapas (RF-04)
  // =====================================================

  listarEtapas: async (funilId: string): Promise<EtapaFunil[]> => {
    const { data, error } = await supabase
      .from('etapas_funil')
      .select('*')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('ordem', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as EtapaFunil[]
  },

  criarEtapa: async (funilId: string, payload: {
    nome: string
    tipo?: string
    cor?: string
    probabilidade?: number
    ordem?: number
  }): Promise<EtapaFunil> => {
    const organizacaoId = await getOrganizacaoId()

    // Obter próxima ordem
    const { data: ultimaEtapa } = await supabase
      .from('etapas_funil')
      .select('ordem')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = payload.ordem ?? ((ultimaEtapa?.ordem ?? 0) + 1)

    const { data, error } = await supabase
      .from('etapas_funil')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: funilId,
        nome: payload.nome,
        tipo: payload.tipo || 'normal',
        cor: payload.cor || '#6B7280',
        probabilidade: payload.probabilidade ?? 50,
        ordem: novaOrdem,
      } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as EtapaFunil
  },

  atualizarEtapa: async (etapaId: string, payload: {
    nome?: string
    cor?: string
    probabilidade?: number
    ordem?: number
  }): Promise<void> => {
    const { error } = await supabase
      .from('etapas_funil')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', etapaId)

    if (error) throw new Error(error.message)
  },

  excluirEtapa: async (etapaId: string): Promise<void> => {
    const { error } = await supabase
      .from('etapas_funil')
      .update({ deletado_em: new Date().toISOString(), ativo: false } as any)
      .eq('id', etapaId)

    if (error) throw new Error(error.message)
  },

  reordenarEtapas: async (ordens: Array<{ id: string; ordem: number }>): Promise<void> => {
    const updates = ordens.map(({ id, ordem }) =>
      supabase
        .from('etapas_funil')
        .update({ ordem, atualizado_em: new Date().toISOString() } as any)
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const erros = results.filter(r => r.error)
    if (erros.length > 0) throw new Error('Erro ao reordenar etapas')
  },

  // =====================================================
  // Campos (RF-05)
  // =====================================================

  listarCamposVinculados: async (funilId: string): Promise<CampoVinculado[]> => {
    const { data, error } = await supabase
      .from('funis_campos')
      .select(`
        id, campo_id, funil_id, obrigatorio, visivel, exibir_card, ordem,
        campo:campos_customizados(id, nome, slug, tipo, entidade, sistema, obrigatorio)
      `)
      .eq('funil_id', funilId)
      .order('ordem', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as unknown as CampoVinculado[]
  },

  listarCamposDisponiveis: async (): Promise<Array<{
    id: string
    nome: string
    slug: string
    tipo: string
    entidade: string
    sistema?: boolean | null
  }>> => {
    const { data, error } = await supabase
      .from('campos_customizados')
      .select('id, nome, slug, tipo, entidade, sistema')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  vincularCampo: async (funilId: string, campoId: string, config?: {
    obrigatorio?: boolean
    visivel?: boolean
    exibir_card?: boolean
    ordem?: number
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const { error } = await supabase
      .from('funis_campos')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: funilId,
        campo_id: campoId,
        obrigatorio: config?.obrigatorio ?? false,
        visivel: config?.visivel ?? true,
        exibir_card: config?.exibir_card ?? false,
        ordem: config?.ordem ?? 0,
      } as any)

    if (error) throw new Error(error.message)
  },

  atualizarVinculoCampo: async (vinculoId: string, payload: {
    obrigatorio?: boolean
    visivel?: boolean
    exibir_card?: boolean
    ordem?: number
  }): Promise<void> => {
    const { error } = await supabase
      .from('funis_campos')
      .update(payload as any)
      .eq('id', vinculoId)

    if (error) throw new Error(error.message)
  },

  desvincularCampo: async (vinculoId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis_campos')
      .delete()
      .eq('id', vinculoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Distribuição (RF-06)
  // =====================================================

  buscarDistribuicao: async (funilId: string): Promise<ConfigDistribuicao | null> => {
    const { data, error } = await supabase
      .from('configuracoes_distribuicao')
      .select('*')
      .eq('funil_id', funilId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as ConfigDistribuicao | null
  },

  salvarDistribuicao: async (funilId: string, payload: {
    modo: string
    horario_especifico?: boolean
    horario_inicio?: string
    horario_fim?: string
    dias_semana?: number[]
    pular_inativos?: boolean
    fallback_manual?: boolean
    sla_ativo?: boolean
    sla_tempo_minutos?: number
    sla_max_redistribuicoes?: number
    sla_acao_limite?: string
  }): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    // Upsert
    const existing = await pipelineConfigApi.buscarDistribuicao(funilId)

    if (existing) {
      const { error } = await supabase
        .from('configuracoes_distribuicao')
        .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
        .eq('funil_id', funilId)

      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('configuracoes_distribuicao')
        .insert({
          organizacao_id: organizacaoId,
          funil_id: funilId,
          ...payload,
        } as any)

      if (error) throw new Error(error.message)
    }
  },

  // =====================================================
  // Atividades / Tarefas por Etapa (RF-07)
  // =====================================================

  listarAtividadesEtapa: async (funilId: string): Promise<Array<{
    etapa: EtapaFunil
    tarefas: EtapaTarefaVinculo[]
  }>> => {
    // Buscar etapas
    const { data: etapas, error: etapasError } = await supabase
      .from('etapas_funil')
      .select('*')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('ordem', { ascending: true })

    if (etapasError) throw new Error(etapasError.message)

    // Buscar tarefas vinculadas
    const etapaIds = (etapas || []).map(e => e.id)
    let tarefasVinculos: EtapaTarefaVinculo[] = []

    if (etapaIds.length > 0) {
      const { data: vinculos, error: vinculosError } = await supabase
        .from('funis_etapas_tarefas')
        .select(`
          id, etapa_funil_id, tarefa_template_id, ativo, ordem,
          tarefa:tarefas_templates(id, titulo, tipo, descricao)
        `)
        .in('etapa_funil_id', etapaIds)

      if (vinculosError) throw new Error(vinculosError.message)
      tarefasVinculos = (vinculos || []) as unknown as EtapaTarefaVinculo[]
    }

    return (etapas || []).map(etapa => ({
      etapa: etapa as EtapaFunil,
      tarefas: tarefasVinculos.filter(t => t.etapa_funil_id === etapa.id),
    }))
  },

  listarTarefasTemplates: async (): Promise<TarefaTemplate[]> => {
    const { data, error } = await supabase
      .from('tarefas_templates')
      .select('id, titulo, tipo, descricao')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('titulo', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as TarefaTemplate[]
  },

  vincularTarefaEtapa: async (etapaFunilId: string, tarefaTemplateId: string): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const { error } = await supabase
      .from('funis_etapas_tarefas')
      .insert({
        organizacao_id: organizacaoId,
        etapa_funil_id: etapaFunilId,
        tarefa_template_id: tarefaTemplateId,
      } as any)

    if (error) throw new Error(error.message)
  },

  desvincularTarefaEtapa: async (vinculoId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis_etapas_tarefas')
      .delete()
      .eq('id', vinculoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Qualificação / Regras MQL (RF-08)
  // =====================================================

  listarRegrasVinculadas: async (funilId: string): Promise<Array<{
    id: string
    regra_id: string
    ativo?: boolean | null
    regra?: RegraQualificacao | null
  }>> => {
    const { data, error } = await supabase
      .from('funis_regras_qualificacao')
      .select(`
        id, regra_id, ativo,
        regra:regras_qualificacao(id, nome, descricao, campo_id, operador, valor, valores, ativo)
      `)
      .eq('funil_id', funilId)

    if (error) throw new Error(error.message)
    return (data || []) as any
  },

  listarRegrasDisponiveis: async (): Promise<RegraQualificacao[]> => {
    const { data, error } = await supabase
      .from('regras_qualificacao')
      .select('id, nome, descricao, campo_id, operador, valor, valores, ativo')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as RegraQualificacao[]
  },

  vincularRegra: async (funilId: string, regraId: string): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const { error } = await supabase
      .from('funis_regras_qualificacao')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: funilId,
        regra_id: regraId,
      } as any)

    if (error) throw new Error(error.message)
  },

  desvincularRegra: async (vinculoId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis_regras_qualificacao')
      .delete()
      .eq('id', vinculoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Motivos (RF-09)
  // =====================================================

  listarMotivosVinculados: async (funilId: string): Promise<Array<{
    id: string
    motivo_id: string
    ativo?: boolean | null
    motivo?: MotivoResultado | null
  }>> => {
    const { data, error } = await supabase
      .from('funis_motivos')
      .select(`
        id, motivo_id, ativo,
        motivo:motivos_resultado(id, nome, descricao, tipo, cor, ativo, padrao)
      `)
      .eq('funil_id', funilId)

    if (error) throw new Error(error.message)
    return (data || []) as any
  },

  listarMotivosDisponiveis: async (): Promise<MotivoResultado[]> => {
    const { data, error } = await supabase
      .from('motivos_resultado')
      .select('id, nome, descricao, tipo, cor, ativo, padrao')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as MotivoResultado[]
  },

  vincularMotivo: async (funilId: string, motivoId: string): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const { error } = await supabase
      .from('funis_motivos')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: funilId,
        motivo_id: motivoId,
      } as any)

    if (error) throw new Error(error.message)
  },

  desvincularMotivo: async (vinculoId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis_motivos')
      .delete()
      .eq('id', vinculoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Atualizar Pipeline (nome, toggle motivo, etc)
  // =====================================================

  atualizarPipeline: async (funilId: string, payload: {
    nome?: string
    descricao?: string | null
    cor?: string
    exigir_motivo_resultado?: boolean
    ativo?: boolean
  }): Promise<void> => {
    const { error } = await supabase
      .from('funis')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', funilId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Membros da Pipeline
  // =====================================================

  listarMembros: async (funilId: string): Promise<Array<{
    id: string
    usuario_id: string
    ativo?: boolean | null
    usuario?: { id: string; nome: string; sobrenome?: string | null }
  }>> => {
    const { data, error } = await supabase
      .from('funis_membros')
      .select(`
        id, usuario_id, ativo,
        usuario:usuarios(id, nome, sobrenome)
      `)
      .eq('funil_id', funilId)

    if (error) throw new Error(error.message)
    return (data || []) as any
  },
}
