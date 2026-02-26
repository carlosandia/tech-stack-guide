/**
 * AIDEV-NOTE: Service API para Negócios (Funis, Etapas, Oportunidades)
 * Usa Supabase client direto (respeita RLS)
 * Conforme PRD-07 - Módulo de Negócios
 */

import { supabase } from '@/lib/supabase'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'

// =====================================================
// Types
// =====================================================

export interface Funil {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  cor?: string | null
  exigir_motivo_resultado?: boolean | null
  arquivado?: boolean | null
  arquivado_em?: string | null
  ativo?: boolean | null
  criado_em: string
  criado_por?: string | null
  atualizado_em: string
  deletado_em?: string | null
}

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
  deletado_em?: string | null
}

export interface Oportunidade {
  id: string
  organizacao_id: string
  funil_id: string
  etapa_id: string
  contato_id: string
  titulo: string
  valor?: number | null
  moeda?: string | null
  tipo_valor?: string | null
  modo_valor?: 'manual' | 'produtos' | null
  recorrente?: boolean | null
  periodo_recorrencia?: string | null
  usuario_responsavel_id?: string | null
  previsao_fechamento?: string | null
  fechado_em?: string | null
  motivo_resultado_id?: string | null
  observacoes?: string | null
  qualificado_mql?: boolean | null
  qualificado_mql_em?: string | null
  qualificado_sql?: boolean | null
  qualificado_sql_em?: string | null
  criado_por?: string | null
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  // Campos enriquecidos
  contato?: {
    id: string
    nome?: string | null
    sobrenome?: string | null
    email?: string | null
    telefone?: string | null
    tipo: string
    nome_fantasia?: string | null
    razao_social?: string | null
    cargo?: string | null
    cnpj?: string | null
    linkedin_url?: string | null
    website?: string | null
    observacoes?: string | null
    endereco_logradouro?: string | null
    endereco_numero?: string | null
    endereco_bairro?: string | null
    endereco_cidade?: string | null
    endereco_estado?: string | null
    endereco_cep?: string | null
    empresa_id?: string | null
    empresa?: Record<string, unknown> | null
    origem?: string | null
  } | null
  responsavel?: {
    id: string
    nome: string
    sobrenome?: string | null
    avatar_url?: string | null
  } | null
  etapa?: EtapaFunil | null
}

export interface FunilComEtapas extends Funil {
  etapas: EtapaFunil[]
}

export interface KanbanData {
  funil: Funil
  etapas: Array<EtapaFunil & {
    oportunidades: Oportunidade[]
    total_oportunidades: number
    valor_total: number
  }>
}

// =====================================================
// API Funis (Pipelines)
// =====================================================

export const negociosApi = {
  // Listar funis do tenant
  listarFunis: async (): Promise<Funil[]> => {
    const { data, error } = await supabase
      .from('funis')
      .select('*')
      .is('deletado_em', null)
      .order('criado_em', { ascending: true })

    if (error) throw new Error(error.message)
    return (data || []) as Funil[]
  },

  // Buscar funil com etapas
  buscarFunilComEtapas: async (funilId: string): Promise<FunilComEtapas> => {
    const { data: funil, error: funilError } = await supabase
      .from('funis')
      .select('*')
      .eq('id', funilId)
      .is('deletado_em', null)
      .maybeSingle()

    if (funilError) throw new Error(funilError.message)
    if (!funil) throw new Error('Funil não encontrado')

    const { data: etapas, error: etapasError } = await supabase
      .from('etapas_funil')
      .select('*')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (etapasError) throw new Error(etapasError.message)

    return {
      ...(funil as Funil),
      etapas: (etapas || []) as EtapaFunil[],
    }
  },

  // Criar funil com etapas padrão
  criarFunil: async (payload: { nome: string; descricao?: string; cor?: string }): Promise<Funil> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data: funil, error: funilError } = await supabase
      .from('funis')
      .insert({
        organizacao_id: organizacaoId,
        nome: payload.nome,
        descricao: payload.descricao || null,
        cor: payload.cor || '#3B82F6',
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (funilError) throw new Error(funilError.message)

    // Criar etapas padrão
    const etapasPadrao = [
      { nome: 'Novos Negócios', tipo: 'entrada', cor: '#3B82F6', probabilidade: 10, ordem: 1 },
      { nome: 'Qualificação', tipo: 'normal', cor: '#F59E0B', probabilidade: 30, ordem: 2 },
      { nome: 'Proposta', tipo: 'normal', cor: '#F97316', probabilidade: 50, ordem: 3 },
      { nome: 'Negociação', tipo: 'normal', cor: '#8B5CF6', probabilidade: 75, ordem: 4 },
      { nome: 'Ganho', tipo: 'ganho', cor: '#22C55E', probabilidade: 100, ordem: 5 },
      { nome: 'Perdido', tipo: 'perda', cor: '#EF4444', probabilidade: 0, ordem: 6 },
    ]

    const { error: etapasError } = await supabase
      .from('etapas_funil')
      .insert(etapasPadrao.map(e => ({
        organizacao_id: organizacaoId,
        funil_id: funil.id,
        ...e,
      })) as any)

    if (etapasError) console.error('Erro ao criar etapas padrão:', etapasError)

    return funil as Funil
  },

  // Carregar dados do Kanban (etapas + oportunidades)
  // AIDEV-NOTE: Aplica isolamento Member/Admin (RF-PRD-07)
  // Members só veem suas próprias oportunidades
  carregarKanban: async (funilId: string, filtros?: {
    busca?: string
    responsavelIds?: string[]
    valorMin?: number
    valorMax?: number
    periodoInicio?: string
    periodoFim?: string
    dataCriacaoInicio?: string
    dataCriacaoFim?: string
    previsaoFechamentoInicio?: string
    previsaoFechamentoFim?: string
  }): Promise<KanbanData> => {
    // Buscar funil
    const { data: funil, error: funilError } = await supabase
      .from('funis')
      .select('*')
      .eq('id', funilId)
      .maybeSingle()

    if (funilError) throw new Error(funilError.message)
    if (!funil) throw new Error('Funil não encontrado')

    // Buscar etapas
    const { data: etapas, error: etapasError } = await supabase
      .from('etapas_funil')
      .select('*')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (etapasError) throw new Error(etapasError.message)

    // Buscar role e userId do usuário atual para isolamento
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let currentUserId: string | null = null
    let currentUserRole: string = 'member'

    if (authUser) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id, role')
        .eq('auth_id', authUser.id)
        .maybeSingle()
      if (userData) {
        currentUserId = userData.id
        currentUserRole = userData.role || 'member'
      }
    }

    // Buscar oportunidades
    // AIDEV-NOTE: SELECT pontual — sem utm_*, fechado_em, motivo, qualificado_*_em (Performance 4.3)
    let oportunidadesQuery = supabase
      .from('oportunidades')
      .select('id, organizacao_id, funil_id, etapa_id, contato_id, titulo, valor, moeda, usuario_responsavel_id, previsao_fechamento, qualificado_mql, qualificado_sql, observacoes, posicao, criado_em, atualizado_em')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('posicao', { ascending: true })

    // ISOLAMENTO: Members só veem suas próprias oportunidades
    if (currentUserRole === 'member' && currentUserId) {
      oportunidadesQuery = oportunidadesQuery.eq('usuario_responsavel_id', currentUserId)
    }

    if (filtros?.responsavelIds?.length) {
      oportunidadesQuery = oportunidadesQuery.in('usuario_responsavel_id', filtros.responsavelIds)
    }

    if (filtros?.busca) {
      oportunidadesQuery = oportunidadesQuery.ilike('titulo', `%${filtros.busca}%`)
    }

    if (filtros?.valorMin !== undefined) {
      oportunidadesQuery = oportunidadesQuery.gte('valor', filtros.valorMin)
    }

    if (filtros?.valorMax !== undefined) {
      oportunidadesQuery = oportunidadesQuery.lte('valor', filtros.valorMax)
    }

    if (filtros?.periodoInicio) {
      oportunidadesQuery = oportunidadesQuery.gte('criado_em', filtros.periodoInicio)
    }

    if (filtros?.periodoFim) {
      oportunidadesQuery = oportunidadesQuery.lte('criado_em', filtros.periodoFim)
    }

    if (filtros?.dataCriacaoInicio) {
      oportunidadesQuery = oportunidadesQuery.gte('criado_em', filtros.dataCriacaoInicio)
    }
    if (filtros?.dataCriacaoFim) {
      oportunidadesQuery = oportunidadesQuery.lte('criado_em', filtros.dataCriacaoFim + 'T23:59:59.999Z')
    }
    if (filtros?.previsaoFechamentoInicio) {
      oportunidadesQuery = oportunidadesQuery.gte('previsao_fechamento', filtros.previsaoFechamentoInicio)
    }
    if (filtros?.previsaoFechamentoFim) {
      oportunidadesQuery = oportunidadesQuery.lte('previsao_fechamento', filtros.previsaoFechamentoFim)
    }

    const { data: oportunidades, error: opError } = await oportunidadesQuery

    if (opError) throw new Error(opError.message)

    const ops = (oportunidades || []) as Oportunidade[]

    // Enriquecer com contato e responsavel
    const contatoIds = [...new Set(ops.map(o => o.contato_id))]
    const responsavelIds = [...new Set(ops.filter(o => o.usuario_responsavel_id).map(o => o.usuario_responsavel_id!))]

    let contatosMap: Record<string, Oportunidade['contato']> = {}
    let responsaveisMap: Record<string, { id: string; nome: string; sobrenome?: string; avatar_url?: string | null }> = {}

    if (contatoIds.length > 0) {
      const { data: contatos } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, telefone, tipo, nome_fantasia, razao_social, origem')
        .in('id', contatoIds)

      if (contatos) {
        for (const c of contatos) {
          contatosMap[c.id] = {
            id: c.id,
            nome: c.nome,
            sobrenome: c.sobrenome,
            email: c.email,
            telefone: c.telefone,
            tipo: c.tipo,
            nome_fantasia: c.nome_fantasia,
            razao_social: c.razao_social,
            origem: (c as any).origem || null,
          }
        }
      }
    }

    if (responsavelIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, avatar_url')
        .in('id', responsavelIds)

      if (usuarios) {
        for (const u of usuarios) {
          responsaveisMap[u.id] = { id: u.id, nome: u.nome, sobrenome: u.sobrenome || undefined, avatar_url: u.avatar_url }
        }
      }
    }

    // Buscar contagem de tarefas por oportunidade (pendentes E total)
    // AIDEV-NOTE: Filtra por etapas do funil atual — tarefas de outras pipelines são ocultadas
    const opIds = ops.map(o => o.id)
    const etapaIdsFunil = new Set((etapas || []).map(e => e.id))
    let tarefasPendentesMap: Record<string, number> = {}
    let tarefasTotalMap: Record<string, number> = {}

    if (opIds.length > 0) {
      const batchSize = 50
      const batches: string[][] = []
      for (let i = 0; i < opIds.length; i += batchSize) {
        batches.push(opIds.slice(i, i + batchSize))
      }
      // AIDEV-NOTE: Promise.all paralleliza os batches — N queries seriais → N queries paralelas
      const resultados = await Promise.all(
        batches.map(batch =>
          supabase
            .from('tarefas')
            .select('oportunidade_id, status, etapa_origem_id')
            .in('oportunidade_id', batch)
            .is('deletado_em', null)
        )
      )
      for (const { data: tarefas } of resultados) {
        if (tarefas) {
          for (const t of tarefas) {
            // Filtrar: só contar tarefas manuais (sem etapa) ou da pipeline atual
            if (t.etapa_origem_id && !etapaIdsFunil.has(t.etapa_origem_id)) continue

            if (t.oportunidade_id) {
              tarefasTotalMap[t.oportunidade_id] = (tarefasTotalMap[t.oportunidade_id] || 0) + 1
              if (t.status === 'pendente') {
                tarefasPendentesMap[t.oportunidade_id] = (tarefasPendentesMap[t.oportunidade_id] || 0) + 1
              }
            }
          }
        }
      }
    }

    // Buscar segmentos dos contatos para exibir tags nos cards
    let segmentosContatoMap: Record<string, Array<{ id: string; nome: string; cor: string }>> = {}

    if (contatoIds.length > 0) {
      const { data: contatoSegmentos } = await supabase
        .from('contatos_segmentos')
        .select('contato_id, segmento_id')
        .in('contato_id', contatoIds)

      if (contatoSegmentos && contatoSegmentos.length > 0) {
        const segIds = [...new Set(contatoSegmentos.map(cs => cs.segmento_id))]
        const { data: segmentos } = await supabase
          .from('segmentos')
          .select('id, nome, cor')
          .in('id', segIds)
          .is('deletado_em', null)

        const segMap: Record<string, { id: string; nome: string; cor: string }> = {}
        if (segmentos) {
          for (const s of segmentos) {
            segMap[s.id] = { id: s.id, nome: s.nome, cor: s.cor || '#6B7280' }
          }
        }

        for (const cs of contatoSegmentos) {
          if (!segmentosContatoMap[cs.contato_id]) segmentosContatoMap[cs.contato_id] = []
          if (segMap[cs.segmento_id]) {
            segmentosContatoMap[cs.contato_id].push(segMap[cs.segmento_id])
          }
        }
      }
    }

    // Enriquecer oportunidades
    const opsEnriquecidas = ops.map(o => ({
      ...o,
      contato: contatosMap[o.contato_id] || null,
      responsavel: o.usuario_responsavel_id ? responsaveisMap[o.usuario_responsavel_id] || null : null,
      _tarefas_pendentes: tarefasPendentesMap[o.id] || 0,
      _tarefas_total: tarefasTotalMap[o.id] || 0,
      _segmentos: segmentosContatoMap[o.contato_id] || [],
    }))

    // AIDEV-NOTE: Safety net — ordenar etapas por tipo (Entrada → Normal → Ganho → Perda)
    // Garante ordem correta mesmo com dados legados inconsistentes
    const ordemTipo: Record<string, number> = { entrada: 0, normal: 1, ganho: 2, perda: 3 }
    const etapasOrdenadas = [...(etapas || [])].sort((a, b) => {
      const tipoA = ordemTipo[a.tipo] ?? 1
      const tipoB = ordemTipo[b.tipo] ?? 1
      if (tipoA !== tipoB) return tipoA - tipoB
      return (a.ordem ?? 0) - (b.ordem ?? 0)
    })

    // Agrupar por etapa
    const etapasComOps = etapasOrdenadas.map(etapa => {
      const opsEtapa = opsEnriquecidas.filter(o => o.etapa_id === etapa.id)
      return {
        ...(etapa as EtapaFunil),
        oportunidades: opsEtapa,
        total_oportunidades: opsEtapa.length,
        valor_total: opsEtapa.reduce((sum, o) => sum + (o.valor || 0), 0),
      }
    })

    return {
      funil: funil as Funil,
      etapas: etapasComOps,
    }
  },

  // Mover oportunidade para outra etapa (com persistência de posição)
  moverEtapa: async (oportunidadeId: string, etapaDestinoId: string, dropIndex?: number): Promise<void> => {
    // Buscar dados da oportunidade para criar tarefas automáticas
    const { data: opData } = await supabase
      .from('oportunidades')
      .select('contato_id, organizacao_id, usuario_responsavel_id, criado_por')
      .eq('id', oportunidadeId)
      .single()

    // AIDEV-NOTE: Limpar fechado_em e motivo ao mover para etapa normal (reabre a oportunidade)
    const { error } = await supabase
      .from('oportunidades')
      .update({
        etapa_id: etapaDestinoId,
        fechado_em: null,
        motivo_resultado_id: null,
      } as any)
      .eq('id', oportunidadeId)

    if (error) throw new Error(error.message)

    // AIDEV-NOTE: Recalcular posições na etapa destino para persistir a ordem do drop
    try {
      // Buscar todas as oportunidades da etapa destino ordenadas por posicao atual
      const { data: opsDestino } = await supabase
        .from('oportunidades')
        .select('id')
        .eq('etapa_id', etapaDestinoId)
        .is('deletado_em', null)
        .neq('id', oportunidadeId)
        .order('posicao', { ascending: true })

      const listaOrdenada = (opsDestino || []).map(o => o.id)

      // Inserir o card movido na posição correta
      const idx = (dropIndex !== undefined && dropIndex >= 0) ? dropIndex : listaOrdenada.length
      listaOrdenada.splice(idx, 0, oportunidadeId)

      // AIDEV-NOTE: Batch update via RPC em 1 roundtrip (Plano de Escala 1.2)
      const items = listaOrdenada.map((id, i) => ({ id, posicao: i + 1 }))
      const { error: rpcError } = await supabase.rpc('reordenar_posicoes_etapa', { items } as any)
      if (rpcError) console.error('Erro RPC reordenar_posicoes_etapa:', rpcError)
    } catch (err) {
      console.error('Erro ao recalcular posições:', err)
    }

    // Criar tarefas automáticas da nova etapa
    if (opData) {
      try {
        const userId = await getUsuarioId()
        await negociosApi.criarTarefasAutomaticas(
          oportunidadeId,
          etapaDestinoId,
          opData.contato_id,
          opData.organizacao_id,
          opData.usuario_responsavel_id || userId,
          userId,
        )
      } catch (err) {
        console.error('Erro ao criar tarefas automáticas ao mover etapa:', err)
      }
    }
  },

  // Criar oportunidade
  criarOportunidade: async (payload: {
    funil_id: string
    etapa_id: string
    contato_id: string
    titulo: string
    valor?: number
    recorrente?: boolean
    periodo_recorrencia?: string
    usuario_responsavel_id?: string
    previsao_fechamento?: string
    observacoes?: string
    utm_source?: string
  }): Promise<Oportunidade> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // AIDEV-NOTE: Rodízio removido do frontend — trigger `aplicar_config_pipeline_oportunidade`
    // no banco faz a distribuição (Plano de Escala 1.3). Fallback simples abaixo.
    const responsavelFinal = payload.usuario_responsavel_id || userId

    const insertData: Record<string, unknown> = {
      organizacao_id: organizacaoId,
      funil_id: payload.funil_id,
      etapa_id: payload.etapa_id,
      contato_id: payload.contato_id,
      titulo: payload.titulo,
      valor: payload.valor || null,
      recorrente: payload.recorrente || false,
      periodo_recorrencia: payload.periodo_recorrencia || null,
      usuario_responsavel_id: responsavelFinal,
      previsao_fechamento: payload.previsao_fechamento || null,
      observacoes: payload.observacoes || null,
      criado_por: userId,
      // AIDEV-NOTE: utm_source unificado — label "Origem" na UI, coluna utm_source no banco
      utm_source: payload.utm_source || null,
    }

    const { data, error } = await supabase
      .from('oportunidades')
      .insert(insertData as any)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const oportunidade = data as Oportunidade

    // AIDEV-NOTE: Tarefas automáticas na criação removidas do frontend —
    // trigger `aplicar_config_pipeline_oportunidade` (INSERT) já cria (Plano de Escala 1.4)

    return oportunidade
  },

  // Excluir oportunidade (soft delete)
  excluirOportunidade: async (oportunidadeId: string): Promise<void> => {
    const { error } = await supabase
      .from('oportunidades')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', oportunidadeId)

    if (error) throw new Error(error.message)
  },

  // Fechar oportunidade (ganho/perda)
  fecharOportunidade: async (
    oportunidadeId: string,
    _tipo: 'ganho' | 'perda',
    etapaDestinoId: string,
    motivoId?: string,
    observacoes?: string
  ): Promise<void> => {
    // AIDEV-NOTE: Reset fechado_em para NULL antes de re-fechar, garantindo que a trigger
    // de audit_log detecte a transição NULL -> timestamp mesmo em re-fechamentos (Ganho->Perdido, etc.)
    await supabase
      .from('oportunidades')
      .update({ fechado_em: null } as any)
      .eq('id', oportunidadeId)

    const { error } = await supabase
      .from('oportunidades')
      .update({
        etapa_id: etapaDestinoId,
        motivo_resultado_id: motivoId || null,
        observacoes: observacoes || null,
        fechado_em: new Date().toISOString(),
      } as any)
      .eq('id', oportunidadeId)

    if (error) throw new Error(error.message)
  },

  // Buscar contatos para autocomplete
  buscarContatosAutocomplete: async (
    busca: string,
    tipo: 'pessoa' | 'empresa'
  ): Promise<Array<{
    id: string
    tipo: string
    nome?: string | null
    sobrenome?: string | null
    email?: string | null
    telefone?: string | null
    nome_fantasia?: string | null
    razao_social?: string | null
  }>> => {
    const searchFields = tipo === 'pessoa'
      ? `nome.ilike.%${busca}%,sobrenome.ilike.%${busca}%,email.ilike.%${busca}%,telefone.ilike.%${busca}%`
      : `nome_fantasia.ilike.%${busca}%,razao_social.ilike.%${busca}%,cnpj.ilike.%${busca}%,email.ilike.%${busca}%`

    const { data, error } = await supabase
      .from('contatos')
      .select('id, tipo, nome, sobrenome, email, telefone, nome_fantasia, razao_social')
      .eq('tipo', tipo)
      .is('deletado_em', null)
      .or(searchFields)
      .order('nome', { ascending: true })
      .limit(10)

    if (error) throw new Error(error.message)
    return data || []
  },

  // Criar contato rápido (inline no modal)
  criarContatoRapido: async (payload: Record<string, any> & { tipo: 'pessoa' | 'empresa' }): Promise<{ id: string }> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Whitelist de colunas válidas na tabela contatos
    const VALID_COLUMNS = new Set([
      'tipo', 'nome', 'sobrenome', 'email', 'telefone', 'nome_fantasia',
      'razao_social', 'cnpj', 'cargo', 'linkedin_url', 'website',
      'segmento', 'porte', 'observacoes', 'empresa_id',
    ])

    const insertData: Record<string, unknown> = {
      organizacao_id: organizacaoId,
      tipo: payload.tipo,
      criado_por: userId,
      origem: 'manual',
    }

    for (const [key, val] of Object.entries(payload)) {
      if (key === 'tipo') continue
      if (key.startsWith('custom_')) continue // custom fields handled separately
      if (VALID_COLUMNS.has(key) && val) {
        insertData[key] = val
      }
    }

    // Nota: obrigatoriedade de campos controlada pela config global

    const { data, error } = await supabase
      .from('contatos')
      .insert(insertData as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return { id: data.id }
  },

  // Listar produtos do tenant (com dados MRR e categoria)
  listarProdutos: async (busca?: string): Promise<Array<{
    id: string
    nome: string
    preco: number
    sku?: string | null
    recorrente?: boolean | null
    periodo_recorrencia?: string | null
    moeda?: string | null
    unidade?: string | null
    categoria_id?: string | null
    categoria_nome?: string | null
  }>> => {
    let query = supabase
      .from('produtos')
      .select('id, nome, preco, sku, recorrente, periodo_recorrencia, moeda, unidade, categoria_id')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('nome', { ascending: true })
      .limit(50)

    if (busca && busca.trim().length > 0) {
      query = query.or(`nome.ilike.%${busca}%,sku.ilike.%${busca}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const produtos = data || []

    // Enriquecer com nome da categoria
    const categoriaIds = [...new Set(produtos.filter(p => p.categoria_id).map(p => p.categoria_id!))]
    let categoriasMap: Record<string, string> = {}

    if (categoriaIds.length > 0) {
      const { data: categorias } = await supabase
        .from('categorias_produtos')
        .select('id, nome')
        .in('id', categoriaIds)

      if (categorias) {
        for (const c of categorias) {
          categoriasMap[c.id] = c.nome
        }
      }
    }

    return produtos.map(p => ({
      ...p,
      categoria_nome: p.categoria_id ? categoriasMap[p.categoria_id] || null : null,
    }))
  },

  // Contar oportunidades de um contato (para gerar título automático)
  contarOportunidadesContato: async (contatoId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('oportunidades')
      .select('id', { count: 'exact', head: true })
      .eq('contato_id', contatoId)

    if (error) throw new Error(error.message)
    return count || 0
  },

  // Listar membros do tenant
  listarMembros: async (): Promise<Array<{
    id: string
    nome: string
    sobrenome?: string | null
  }>> => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, sobrenome')
      .eq('status', 'ativo')
      .order('nome', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  // Adicionar produtos a uma oportunidade
  adicionarProdutosOportunidade: async (
    oportunidadeId: string,
    produtos: Array<{
      produto_id: string
      preco_unitario: number
      quantidade: number
      desconto_percentual: number
      subtotal: number
    }>
  ): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const inserts = produtos.map(p => ({
      organizacao_id: organizacaoId,
      oportunidade_id: oportunidadeId,
      produto_id: p.produto_id,
      preco_unitario: p.preco_unitario,
      quantidade: p.quantidade,
      desconto_percentual: p.desconto_percentual,
      subtotal: p.subtotal,
    }))

    const { error } = await supabase
      .from('oportunidades_produtos')
      .insert(inserts as any)

    if (error) throw new Error(error.message)
  },

  // Atualizar nome do funil
  atualizarFunil: async (funilId: string, payload: { nome: string }): Promise<void> => {
    const { error } = await supabase
      .from('funis')
      .update({ nome: payload.nome, atualizado_em: new Date().toISOString() } as any)
      .eq('id', funilId)

    if (error) throw new Error(error.message)
  },

  // Arquivar pipeline
  arquivarFunil: async (funilId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis')
      .update({ arquivado: true, arquivado_em: new Date().toISOString() } as any)
      .eq('id', funilId)

    if (error) throw new Error(error.message)
  },

  // Desarquivar pipeline
  desarquivarFunil: async (funilId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis')
      .update({ arquivado: false, arquivado_em: null } as any)
      .eq('id', funilId)

    if (error) throw new Error(error.message)
  },

  // Excluir pipeline (soft delete)
  excluirFunil: async (funilId: string): Promise<void> => {
    const { error } = await supabase
      .from('funis')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', funilId)

    if (error) {
      console.error('Erro ao excluir funil:', error)
      throw new Error(error.message)
    }
  },

  // Adicionar membros a uma pipeline
  adicionarMembrosFunil: async (funilId: string, usuarioIds: string[]): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()

    const inserts = usuarioIds.map(uid => ({
      organizacao_id: organizacaoId,
      funil_id: funilId,
      usuario_id: uid,
    }))

    const { error } = await supabase
      .from('funis_membros')
      .insert(inserts as any)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Detalhes da Oportunidade (RF-14)
  // =====================================================

  // Buscar oportunidade completa com contato e responsavel
  buscarOportunidade: async (oportunidadeId: string): Promise<Oportunidade> => {
    const { data, error } = await supabase
      .from('oportunidades')
      .select('*')
      .eq('id', oportunidadeId)
      .is('deletado_em', null)
      .single()

    if (error) throw new Error(error.message)

    const op = data as Oportunidade

    // Enriquecer com contato
    if (op.contato_id) {
      const { data: contato } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, telefone, tipo, nome_fantasia, razao_social, cargo, cnpj, linkedin_url, website, observacoes, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, empresa_id')
        .eq('id', op.contato_id)
        .maybeSingle()

      if (contato) {
        let empresa: Record<string, unknown> | null = null

        // Se é pessoa e tem empresa vinculada, buscar dados completos da empresa
        if (contato.tipo === 'pessoa' && contato.empresa_id) {
          const { data: empresaData } = await supabase
            .from('contatos')
            .select('id, nome, nome_fantasia, razao_social, cnpj, email, telefone, website, segmento, porte, observacoes, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep')
            .eq('id', contato.empresa_id)
            .maybeSingle()

          if (empresaData) {
            empresa = empresaData as Record<string, unknown>
          }
        }

        op.contato = {
          id: contato.id,
          nome: contato.nome,
          sobrenome: contato.sobrenome,
          email: contato.email,
          telefone: contato.telefone,
          tipo: contato.tipo,
          nome_fantasia: contato.nome_fantasia,
          razao_social: contato.razao_social,
          cargo: contato.cargo,
          cnpj: contato.cnpj,
          linkedin_url: contato.linkedin_url,
          website: contato.website,
          observacoes: contato.observacoes,
          endereco_logradouro: contato.endereco_logradouro,
          endereco_numero: contato.endereco_numero,
          endereco_bairro: contato.endereco_bairro,
          endereco_cidade: contato.endereco_cidade,
          endereco_estado: contato.endereco_estado,
          endereco_cep: contato.endereco_cep,
          empresa_id: contato.empresa_id,
          empresa,
        }
      }
    }

    // Enriquecer com responsavel
    if (op.usuario_responsavel_id) {
      const { data: responsavel } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, avatar_url')
        .eq('id', op.usuario_responsavel_id)
        .maybeSingle()

      if (responsavel) {
        op.responsavel = { id: responsavel.id, nome: responsavel.nome, sobrenome: responsavel.sobrenome || undefined, avatar_url: responsavel.avatar_url }
      }
    }

    return op
  },

  // Atualizar campos da oportunidade
  atualizarOportunidade: async (oportunidadeId: string, payload: {
    valor?: number | null
    usuario_responsavel_id?: string | null
    previsao_fechamento?: string | null
    observacoes?: string | null
  }): Promise<void> => {
    const { error } = await supabase
      .from('oportunidades')
      .update(payload as any)
      .eq('id', oportunidadeId)

    if (error) throw new Error(error.message)
  },

  // Atualizar campos do contato (inline edit)
  atualizarContato: async (contatoId: string, payload: Record<string, unknown>): Promise<void> => {
    const { error } = await supabase
      .from('contatos')
      .update(payload as any)
      .eq('id', contatoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Anotações
  // =====================================================

  listarAnotacoes: async (oportunidadeId: string): Promise<Array<{
    id: string
    tipo: string
    conteudo: string | null
    audio_url: string | null
    audio_duracao_segundos: number | null
    criado_em: string
    usuario_id: string
    usuario?: { id: string; nome: string; avatar_url?: string | null }
  }>> => {
    // AIDEV-NOTE: Limit de 50 adicionado para evitar carregamento excessivo (Plano de Escala 2.2)
    const { data, error } = await supabase
      .from('anotacoes_oportunidades')
      .select('*')
      .eq('oportunidade_id', oportunidadeId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)

    const anotacoes = data || []

    // Enriquecer com usuário
    const userIds = [...new Set(anotacoes.map(a => a.usuario_id))]
    let usersMap: Record<string, { id: string; nome: string }> = {}

    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds)

      if (usuarios) {
        for (const u of usuarios) {
          usersMap[u.id] = { id: u.id, nome: u.nome }
        }
      }
    }

    return anotacoes.map(a => ({
      id: a.id,
      tipo: a.tipo,
      conteudo: a.conteudo,
      audio_url: a.audio_url,
      audio_duracao_segundos: a.audio_duracao_segundos,
      criado_em: a.criado_em,
      usuario_id: a.usuario_id,
      usuario: usersMap[a.usuario_id] || undefined,
    }))
  },

  criarAnotacaoTexto: async (oportunidadeId: string, conteudo: string): Promise<void> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { error } = await supabase
      .from('anotacoes_oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        oportunidade_id: oportunidadeId,
        usuario_id: userId,
        tipo: 'texto',
        conteudo,
      } as any)

    if (error) throw new Error(error.message)
  },

  atualizarAnotacao: async (anotacaoId: string, conteudo: string): Promise<void> => {
    const { error } = await supabase
      .from('anotacoes_oportunidades')
      .update({ conteudo } as any)
      .eq('id', anotacaoId)

    if (error) throw new Error(error.message)
  },

  excluirAnotacao: async (anotacaoId: string): Promise<void> => {
    const { error } = await supabase
      .from('anotacoes_oportunidades')
      .update({ deletado_em: new Date().toISOString() } as any)
      .eq('id', anotacaoId)

    if (error) throw new Error(error.message)
  },

  // =====================================================
  // Histórico (Timeline) via audit_log
  // =====================================================

  // AIDEV-NOTE: Paginação adicionada com defaults retrocompatíveis (Plano de Escala 2.1)
  listarHistorico: async (oportunidadeId: string, page: number = 0, pageSize: number = 50): Promise<Array<{
    id: string
    acao: string
    entidade: string
    detalhes: Record<string, unknown> | null
    dados_anteriores: Record<string, unknown> | null
    dados_novos: Record<string, unknown> | null
    criado_em: string
    usuario_id: string | null
    usuario_nome: string | null
  }>> => {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from('audit_log')
      .select('id, acao, entidade, detalhes, dados_anteriores, dados_novos, criado_em, usuario_id')
      .eq('entidade_id', oportunidadeId)
      .order('criado_em', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)
    const eventos = (data || []) as any[]

    // Enriquecer com nomes de usuários
    const userIds = [...new Set(eventos.filter(e => e.usuario_id).map(e => e.usuario_id))]
    let usersMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome')
        .in('id', userIds)

      if (usuarios) {
        for (const u of usuarios) {
          usersMap[u.id] = [u.nome, u.sobrenome].filter(Boolean).join(' ')
        }
      }
    }

    // Enriquecer nomes de etapas nos eventos de movimentação
    const etapaIds = new Set<string>()
    for (const ev of eventos) {
      if (ev.acao === 'movimentacao' && ev.detalhes) {
        if (ev.detalhes.etapa_anterior_id) etapaIds.add(ev.detalhes.etapa_anterior_id as string)
        if (ev.detalhes.etapa_nova_id) etapaIds.add(ev.detalhes.etapa_nova_id as string)
      }
    }

    let etapasMap: Record<string, string> = {}
    if (etapaIds.size > 0) {
      const { data: etapas } = await supabase
        .from('etapas_funil')
        .select('id, nome')
        .in('id', [...etapaIds])

      if (etapas) {
        for (const e of etapas) {
          etapasMap[e.id] = e.nome
        }
      }
    }

    // Enriquecer nomes de responsáveis nos eventos de alteração de responsável
    const responsavelIds = new Set<string>()
    for (const ev of eventos) {
      if (ev.acao === 'alteracao_campo' && ev.detalhes?.campo === 'responsavel') {
        if (ev.detalhes.de) responsavelIds.add(ev.detalhes.de as string)
        if (ev.detalhes.para) responsavelIds.add(ev.detalhes.para as string)
      }
    }

    let responsaveisMap: Record<string, string> = {}
    if (responsavelIds.size > 0) {
      const { data: resps } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome')
        .in('id', [...responsavelIds])
      if (resps) {
        for (const r of resps) {
          responsaveisMap[r.id] = [r.nome, r.sobrenome].filter(Boolean).join(' ')
        }
      }
    }

    return eventos.map(ev => {
      let detalhes = ev.detalhes

      // Enriquecer movimentação com nomes de etapas
      if (ev.acao === 'movimentacao' && detalhes) {
        detalhes = {
          ...detalhes,
          etapa_anterior_nome: etapasMap[detalhes.etapa_anterior_id as string] || null,
          etapa_nova_nome: etapasMap[detalhes.etapa_nova_id as string] || null,
        }
      }

      // Enriquecer alteração de responsável com nomes
      if (ev.acao === 'alteracao_campo' && detalhes?.campo === 'responsavel') {
        detalhes = {
          ...detalhes,
          de_nome: detalhes.de ? responsaveisMap[detalhes.de as string] || null : null,
          para_nome: detalhes.para ? responsaveisMap[detalhes.para as string] || null : null,
        }
      }

      return {
        ...ev,
        usuario_nome: ev.usuario_id ? usersMap[ev.usuario_id] || null : null,
        detalhes,
      }
    })
  },

  // =====================================================
  // Tarefas Automáticas (RF-07)
  // =====================================================

  /**
   * Cria tarefas automaticamente baseado nos templates vinculados à etapa.
   * Chamado ao criar oportunidade ou mover para nova etapa.
   */
  criarTarefasAutomaticas: async (
    oportunidadeId: string,
    etapaId: string,
    contatoId: string,
    organizacaoId: string,
    responsavelId: string,
    criadoPorId: string,
  ): Promise<void> => {
    // Buscar templates vinculados à etapa
    const { data: vinculos, error: vinculosError } = await supabase
      .from('funis_etapas_tarefas')
      .select(`
        id, tarefa_template_id, ativo,
        tarefa:tarefas_templates(id, titulo, tipo, descricao, canal, prioridade, dias_prazo)
      `)
      .eq('etapa_funil_id', etapaId)
      .neq('ativo', false)

    if (vinculosError) {
      console.error('Erro ao buscar templates de tarefas:', vinculosError)
      return
    }

    if (!vinculos || vinculos.length === 0) return

    // Deduplicação: buscar tarefas já criadas para esta oportunidade + etapa + template
    const templateIds = vinculos
      .filter((v: any) => v.tarefa)
      .map((v: any) => v.tarefa.id)

    const { data: tarefasExistentes } = await supabase
      .from('tarefas')
      .select('tarefa_template_id, etapa_origem_id')
      .eq('oportunidade_id', oportunidadeId)
      .eq('etapa_origem_id', etapaId)
      .in('tarefa_template_id', templateIds)
      .is('deletado_em', null)

    const jaExistem = new Set(
      (tarefasExistentes || []).map(t => `${t.tarefa_template_id}_${t.etapa_origem_id}`)
    )

    // Criar tarefas a partir dos templates (ignorando duplicatas)
    const tarefasInsert = vinculos
      .filter((v: any) => {
        if (!v.tarefa) return false
        // Deduplicação: pular se já existe tarefa com mesmo template + etapa
        const chave = `${v.tarefa.id}_${etapaId}`
        return !jaExistem.has(chave)
      })
      .map((v: any) => {
        const template = v.tarefa
        const dataVencimento = template.dias_prazo
          ? new Date(Date.now() + template.dias_prazo * 24 * 60 * 60 * 1000).toISOString()
          : null

        return {
          organizacao_id: organizacaoId,
          oportunidade_id: oportunidadeId,
          contato_id: contatoId,
          titulo: template.titulo,
          descricao: template.descricao || null,
          tipo: template.tipo || 'tarefa',
          canal: template.canal || null,
          prioridade: template.prioridade || 'media',
          owner_id: responsavelId,
          criado_por_id: criadoPorId,
          status: 'pendente',
          data_vencimento: dataVencimento,
          tarefa_template_id: template.id,
          etapa_origem_id: etapaId,
        }
      })

    if (tarefasInsert.length === 0) return

    const { error } = await supabase
      .from('tarefas')
      .insert(tarefasInsert as any)

    if (error) {
      console.error('Erro ao criar tarefas automáticas:', error)
    }
  },

  // =====================================================
  // Motor de Qualificação MQL (RF-08)
  // Avalia regras vinculadas ao funil contra dados reais
  // =====================================================

  avaliarQualificacaoMQL: async (oportunidadeId: string): Promise<boolean> => {
    // 1. Buscar oportunidade com funil_id e contato_id
    const { data: oportunidade } = await supabase
      .from('oportunidades')
      .select('id, funil_id, contato_id, qualificado_mql, valor')
      .eq('id', oportunidadeId)
      .maybeSingle()

    if (!oportunidade) return false

    // 2. Buscar regras vinculadas ao funil (ativas)
    const { data: vinculos } = await supabase
      .from('funis_regras_qualificacao')
      .select(`
        id, regra_id, ativo,
        regra:regras_qualificacao(id, nome, campo_id, operador, valor, valores, ativo)
      `)
      .eq('funil_id', oportunidade.funil_id)
      .eq('ativo', true)

    const regrasAtivas = (vinculos || [])
      .filter((v: any) => v.regra?.ativo)
      .map((v: any) => v.regra)

    // Se não há regras, não qualifica
    if (regrasAtivas.length === 0) return false

    // 3. Buscar definições dos campos referenciados
    const campoIds = [...new Set(regrasAtivas.map((r: any) => r.campo_id).filter(Boolean))]
    
    let camposMap: Record<string, { slug: string; entidade: string; tipo: string; sistema: boolean }> = {}
    if (campoIds.length > 0) {
      const { data: campos } = await supabase
        .from('campos_customizados')
        .select('id, slug, entidade, tipo, sistema')
        .in('id', campoIds)

      if (campos) {
        for (const c of campos) {
          camposMap[c.id] = { slug: c.slug, entidade: c.entidade, tipo: c.tipo, sistema: c.sistema ?? false }
        }
      }
    }

    // 4. Buscar valores dos campos customizados para contato e oportunidade
    const { data: valoresContato } = await supabase
      .from('valores_campos_customizados')
      .select('campo_id, valor_texto, valor_numero, valor_data, valor_booleano')
      .eq('entidade_id', oportunidade.contato_id)

    const { data: valoresOportunidade } = await supabase
      .from('valores_campos_customizados')
      .select('campo_id, valor_texto, valor_numero, valor_data, valor_booleano')
      .eq('entidade_id', oportunidadeId)

    // 5. Buscar dados nativos do contato (para campos de sistema)
    const { data: contato } = await supabase
      .from('contatos')
      .select('nome, sobrenome, email, telefone, cargo, linkedin_url, nome_fantasia, razao_social, cnpj, website, segmento, porte')
      .eq('id', oportunidade.contato_id)
      .maybeSingle()

    // 6. Mapear valores: campo_id → valor real
    const getValorCampo = (campoId: string): string => {
      const campoDef = camposMap[campoId]
      if (!campoDef) return ''

      // Campo de sistema → buscar valor nativo do contato
      if (campoDef.sistema && contato) {
        const slugMap: Record<string, string> = {
          nome: contato.nome || '',
          sobrenome: contato.sobrenome || '',
          email: contato.email || '',
          telefone: contato.telefone || '',
          cargo: contato.cargo || '',
          linkedin: contato.linkedin_url || '',
          nome_fantasia: contato.nome_fantasia || '',
          razao_social: contato.razao_social || '',
          cnpj: contato.cnpj || '',
          website: contato.website || '',
          segmento: contato.segmento || '',
          porte: contato.porte || '',
        }
        return slugMap[campoDef.slug] || ''
      }

      // Campo customizado → buscar na tabela valores_campos_customizados
      const valores = campoDef.entidade === 'oportunidade' ? valoresOportunidade : valoresContato
      const registro = (valores || []).find((v: any) => v.campo_id === campoId)
      if (!registro) return ''

      if (registro.valor_texto) return registro.valor_texto
      if (registro.valor_numero !== null) return String(registro.valor_numero)
      if (registro.valor_booleano !== null) return String(registro.valor_booleano)
      if (registro.valor_data) return registro.valor_data
      return ''
    }

    // 7. Avaliar cada regra (lógica AND)
    const avaliarRegra = (regra: any): boolean => {
      const valorCampo = getValorCampo(regra.campo_id)
      const valorRegra = regra.valor || ''
      const operador = regra.operador

      switch (operador) {
        case 'igual':
          return valorCampo.toLowerCase() === valorRegra.toLowerCase()
        case 'diferente':
          return valorCampo.toLowerCase() !== valorRegra.toLowerCase()
        case 'contem':
          return valorCampo.toLowerCase().includes(valorRegra.toLowerCase())
        case 'nao_contem':
          return !valorCampo.toLowerCase().includes(valorRegra.toLowerCase())
        case 'comeca_com':
          return valorCampo.toLowerCase().startsWith(valorRegra.toLowerCase())
        case 'termina_com':
          return valorCampo.toLowerCase().endsWith(valorRegra.toLowerCase())
        case 'preenchido':
          return valorCampo.trim().length > 0
        case 'vazio':
          return valorCampo.trim().length === 0
        case 'maior_que': {
          const numCampo = parseFloat(valorCampo)
          const numRegra = parseFloat(valorRegra)
          return !isNaN(numCampo) && !isNaN(numRegra) && numCampo > numRegra
        }
        case 'menor_que': {
          const numCampo = parseFloat(valorCampo)
          const numRegra = parseFloat(valorRegra)
          return !isNaN(numCampo) && !isNaN(numRegra) && numCampo < numRegra
        }
        case 'maior_igual': {
          const numCampo = parseFloat(valorCampo)
          const numRegra = parseFloat(valorRegra)
          return !isNaN(numCampo) && !isNaN(numRegra) && numCampo >= numRegra
        }
        case 'menor_igual': {
          const numCampo = parseFloat(valorCampo)
          const numRegra = parseFloat(valorRegra)
          return !isNaN(numCampo) && !isNaN(numRegra) && numCampo <= numRegra
        }
        default:
          return false
      }
    }

    const todasPassam = regrasAtivas.every(avaliarRegra)

    // 8. Atualizar qualificado_mql se mudou
    if (todasPassam !== (oportunidade.qualificado_mql || false)) {
      await supabase
        .from('oportunidades')
        .update({
          qualificado_mql: todasPassam,
          qualificado_mql_em: todasPassam ? new Date().toISOString() : null,
        } as any)
        .eq('id', oportunidadeId)
    }

    return todasPassam
  },

  // Excluir oportunidades em massa (soft delete)
  excluirOportunidadesEmMassa: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from('oportunidades')
      .update({ deletado_em: new Date().toISOString() } as any)
      .in('id', ids)

    if (error) throw new Error(error.message)
  },

  // Mover oportunidades em massa para outra etapa
  moverOportunidadesEmMassa: async (ids: string[], etapaDestinoId: string): Promise<void> => {
    const { error } = await supabase
      .from('oportunidades')
      .update({ etapa_id: etapaDestinoId } as any)
      .in('id', ids)

    if (error) throw new Error(error.message)
  },

  // Mover oportunidades em massa para outra pipeline (funil + etapa)
  // AIDEV-NOTE: Ao trocar de pipeline, aplica configurações da pipeline destino:
  // 1. Tarefas automáticas da etapa destino
  // 2. Reavaliação de qualificação MQL com regras do novo funil
  moverOportunidadesParaOutraPipeline: async (ids: string[], funilDestinoId: string, etapaDestinoId: string): Promise<void> => {
    // Buscar dados das oportunidades antes de mover (para tarefas automáticas)
    const { data: opsData } = await supabase
      .from('oportunidades')
      .select('id, contato_id, organizacao_id, usuario_responsavel_id, criado_por')
      .in('id', ids)

    // Atualizar funil + etapa + limpar fechamento (reabrir se estava fechada)
    const { error } = await supabase
      .from('oportunidades')
      .update({
        funil_id: funilDestinoId,
        etapa_id: etapaDestinoId,
        fechado_em: null,
        motivo_resultado_id: null,
      } as any)
      .in('id', ids)

    if (error) throw new Error(error.message)

    // Aplicar configurações da pipeline destino para cada oportunidade
    // AIDEV-NOTE: Executado APÓS o update para garantir que a oportunidade já está no funil destino
    if (opsData && opsData.length > 0) {
      const userId = await getUsuarioId()
      const orgId = await getOrganizacaoId()

      for (const op of opsData) {
        const contatoId = op.contato_id
        const orgIdOp = op.organizacao_id || orgId

        // 1. Criar tarefas automáticas da etapa destino
        try {
          console.log(`[MoverPipeline] Criando tarefas para op=${op.id}, etapa=${etapaDestinoId}`)
          await negociosApi.criarTarefasAutomaticas(
            op.id,
            etapaDestinoId,
            contatoId,
            orgIdOp,
            op.usuario_responsavel_id || userId,
            userId,
          )
        } catch (err) {
          console.error(`[MoverPipeline] Erro ao criar tarefas para op ${op.id}:`, err)
        }

        // 2. Reavaliar qualificação MQL com regras do novo funil
        try {
          await negociosApi.avaliarQualificacaoMQL(op.id)
        } catch (err) {
          console.error(`[MoverPipeline] Erro ao reavaliar MQL para op ${op.id}:`, err)
        }
      }
    } else {
      console.warn('[MoverPipeline] Nenhuma oportunidade encontrada para aplicar config destino. IDs:', ids)
    }
  },

  // Contar oportunidades ativas de um funil
  contarOportunidadesFunil: async (funilId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('oportunidades')
      .select('*', { count: 'exact', head: true })
      .eq('funil_id', funilId)
      .is('deletado_em', null)

    if (error) throw new Error(error.message)
    return count || 0
  },

  // AIDEV-NOTE: Migrar todas oportunidades de um funil para outro e depois excluir o funil origem
  // Reutiliza moverOportunidadesParaOutraPipeline para manter consistência (tarefas, MQL, reset)
  migrarEExcluirPipeline: async (funilOrigemId: string, funilDestinoId: string): Promise<{ migradas: number }> => {
    // 1. Buscar etapa de entrada do funil destino
    const { data: etapaEntrada, error: etapaError } = await supabase
      .from('etapas_funil')
      .select('id')
      .eq('funil_id', funilDestinoId)
      .eq('tipo', 'entrada')
      .is('deletado_em', null)
      .eq('ativo', true)
      .maybeSingle()

    if (etapaError) throw new Error(etapaError.message)
    if (!etapaEntrada) throw new Error('Pipeline destino não possui etapa de entrada')

    // 2. Buscar IDs das oportunidades ativas do funil origem
    const { data: ops, error: opsError } = await supabase
      .from('oportunidades')
      .select('id')
      .eq('funil_id', funilOrigemId)
      .is('deletado_em', null)

    if (opsError) throw new Error(opsError.message)

    const ids = (ops || []).map(o => o.id)

    // 3. Migrar oportunidades (se houver)
    if (ids.length > 0) {
      await negociosApi.moverOportunidadesParaOutraPipeline(ids, funilDestinoId, etapaEntrada.id)
    }

    // 4. Excluir pipeline origem (soft delete)
    await negociosApi.excluirFunil(funilOrigemId)

    return { migradas: ids.length }
  },
}
