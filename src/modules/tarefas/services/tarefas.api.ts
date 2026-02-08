/**
 * AIDEV-NOTE: Service API para Tarefas (PRD-10)
 * Usa Supabase client direto (respeita RLS via get_user_tenant_id)
 * Conforme PRD-10 - Módulo de Tarefas (Acompanhamento)
 *
 * Acesso:
 * - Admin: vê todas tarefas do tenant
 * - Member: vê apenas suas próprias tarefas
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helpers - Cache de IDs (mesmo padrão contatos/negocios)
// =====================================================

let _cachedOrgId: string | null = null
let _cachedUserId: string | null = null
let _cachedUserRole: string | null = null

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

async function getUsuarioId(): Promise<string> {
  if (_cachedUserId) return _cachedUserId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.id) throw new Error('Usuário não encontrado')
  _cachedUserId = data.id
  return _cachedUserId
}

async function getUserRole(): Promise<string> {
  if (_cachedUserRole) return _cachedUserRole

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.role) throw new Error('Role não encontrado')
  _cachedUserRole = data.role
  return _cachedUserRole
}

// Reset cache on auth state change
supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
  _cachedUserId = null
  _cachedUserRole = null
})

// =====================================================
// Types
// =====================================================

export type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente'
export type TipoTarefa = 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'visita' | 'outro'

export interface TarefaComDetalhes {
  id: string
  organizacao_id: string
  oportunidade_id: string | null
  contato_id: string | null
  titulo: string
  descricao: string | null
  tipo: TipoTarefa
  canal: string | null
  owner_id: string
  criado_por_id: string
  data_vencimento: string | null
  data_conclusao: string | null
  status: StatusTarefa
  prioridade: PrioridadeTarefa | null
  lembrete_em: string | null
  lembrete_enviado: boolean | null
  tarefa_template_id: string | null
  etapa_origem_id: string | null
  criado_em: string
  atualizado_em: string
  deletado_em: string | null
  // Joins
  oportunidades?: {
    id: string
    titulo: string | null
    funil_id: string | null
    etapa_id: string | null
  } | null
  owner?: { id: string; nome: string } | null
  // Enriched post-query
  funil_nome?: string | null
  etapa_nome?: string | null
  etapa_origem_nome?: string | null
}

export interface ListarTarefasParams {
  pipeline_id?: string
  etapa_id?: string
  status?: StatusTarefa[]
  prioridade?: PrioridadeTarefa[]
  owner_id?: string
  data_inicio?: string
  data_fim?: string
  busca?: string
  atrasadas?: boolean
  page?: number
  limit?: number
  order_by?: 'data_vencimento' | 'criado_em' | 'prioridade' | 'status'
  order_dir?: 'asc' | 'desc'
}

export interface ListarTarefasResponse {
  data: TarefaComDetalhes[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface TarefasMetricas {
  em_aberto: number
  atrasadas: number
  concluidas: number
  tempo_medio_dias: number | null
}

export interface MembroEquipe {
  id: string
  nome: string
  email: string
}

// =====================================================
// API
// =====================================================

export const tarefasApi = {
  /**
   * Lista tarefas com filtros, paginação e joins
   */
  listar: async (params?: ListarTarefasParams): Promise<ListarTarefasResponse> => {
    const organizacaoId = await getOrganizacaoId()
    const usuarioId = await getUsuarioId()
    const role = await getUserRole()

    const page = params?.page || 1
    const limit = params?.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    const orderBy = params?.order_by || 'data_vencimento'
    const orderAsc = (params?.order_dir || 'asc') === 'asc'

    let query = supabase
      .from('tarefas')
      .select(`
        *,
        oportunidades!tarefas_oportunidade_id_fkey(id, titulo, funil_id, etapa_id),
        owner:usuarios!tarefas_owner_id_fkey(id, nome)
      `, { count: 'exact' })
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null)
      .is('deletado_em', null)
      .order(orderBy, { ascending: orderAsc, nullsFirst: false })
      .range(from, to)

    // Role-based filtering
    if (role === 'member') {
      query = query.eq('owner_id', usuarioId)
    } else if (params?.owner_id) {
      query = query.eq('owner_id', params.owner_id)
    }

    // Filtros
    if (params?.status && params.status.length > 0) {
      query = query.in('status', params.status)
    }

    if (params?.prioridade && params.prioridade.length > 0) {
      query = query.in('prioridade', params.prioridade)
    }

    if (params?.etapa_id) {
      query = query.eq('etapa_origem_id', params.etapa_id)
    }

    if (params?.data_inicio) {
      query = query.gte('data_vencimento', params.data_inicio)
    }

    if (params?.data_fim) {
      query = query.lte('data_vencimento', params.data_fim)
    }

    if (params?.busca) {
      query = query.ilike('titulo', `%${params.busca}%`)
    }

    // Filtro de atrasadas: pendente + data_vencimento < now
    if (params?.atrasadas) {
      query = query
        .eq('status', 'pendente')
        .lt('data_vencimento', new Date().toISOString())
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    let tarefas = (data || []) as TarefaComDetalhes[]

    // Enrich with funil/etapa names (separate queries to avoid PostgREST ambiguity)
    if (tarefas.length > 0) {
      const funilIds = [...new Set(tarefas.map(t => t.oportunidades?.funil_id).filter(Boolean))] as string[]
      const etapaIds = [...new Set([
        ...tarefas.map(t => t.oportunidades?.etapa_id).filter(Boolean),
        ...tarefas.map(t => t.etapa_origem_id).filter(Boolean),
      ])] as string[]

      const [funisRes, etapasRes] = await Promise.all([
        funilIds.length > 0
          ? supabase.from('funis').select('id, nome').in('id', funilIds)
          : Promise.resolve({ data: [] }),
        etapaIds.length > 0
          ? supabase.from('etapas_funil').select('id, nome').in('id', etapaIds)
          : Promise.resolve({ data: [] }),
      ])

      const funisMap = new Map((funisRes.data || []).map(f => [f.id, f.nome]))
      const etapasMap = new Map((etapasRes.data || []).map(e => [e.id, e.nome]))

      tarefas = tarefas.map(t => ({
        ...t,
        funil_nome: t.oportunidades?.funil_id ? funisMap.get(t.oportunidades.funil_id) || null : null,
        etapa_nome: t.oportunidades?.etapa_id ? etapasMap.get(t.oportunidades.etapa_id) || null : null,
        etapa_origem_nome: t.etapa_origem_id ? etapasMap.get(t.etapa_origem_id) || null : null,
      }))
    }

    // Filtro por pipeline_id (post-query via oportunidade)
    if (params?.pipeline_id) {
      tarefas = tarefas.filter(t =>
        t.oportunidades?.funil_id === params.pipeline_id
      )
    }

    const total = params?.pipeline_id
      ? tarefas.length
      : (count || 0)

    return {
      data: tarefas,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Obtém métricas agregadas de tarefas
   */
  obterMetricas: async (params?: {
    pipeline_id?: string
    etapa_id?: string
    owner_id?: string
    data_inicio?: string
    data_fim?: string
  }): Promise<TarefasMetricas> => {
    const organizacaoId = await getOrganizacaoId()
    const usuarioId = await getUsuarioId()
    const role = await getUserRole()

    // Base query builder helper
    const buildQuery = () => {
      let q = supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', organizacaoId)
        .not('oportunidade_id', 'is', null)
        .is('deletado_em', null)

      if (role === 'member') {
        q = q.eq('owner_id', usuarioId)
      } else if (params?.owner_id) {
        q = q.eq('owner_id', params.owner_id)
      }

      if (params?.etapa_id) {
        q = q.eq('etapa_origem_id', params.etapa_id)
      }

      return q
    }

    // Em aberto: pendente ou em_andamento
    const emAbertoQuery = buildQuery().in('status', ['pendente', 'em_andamento'])

    // Atrasadas: pendente + vencida
    const atrasadasQuery = buildQuery()
      .eq('status', 'pendente')
      .lt('data_vencimento', new Date().toISOString())

    // Concluídas (no período se filtrado)
    let concluidasQuery = buildQuery().eq('status', 'concluida')
    if (params?.data_inicio) {
      concluidasQuery = concluidasQuery.gte('data_conclusao', params.data_inicio)
    }
    if (params?.data_fim) {
      concluidasQuery = concluidasQuery.lte('data_conclusao', params.data_fim)
    }

    // Tempo médio: buscar concluídas com datas para calcular
    let tempoQuery = supabase
      .from('tarefas')
      .select('criado_em, data_conclusao')
      .eq('organizacao_id', organizacaoId)
      .not('oportunidade_id', 'is', null)
      .is('deletado_em', null)
      .eq('status', 'concluida')
      .not('data_conclusao', 'is', null)
      .limit(500)

    if (role === 'member') {
      tempoQuery = tempoQuery.eq('owner_id', usuarioId)
    } else if (params?.owner_id) {
      tempoQuery = tempoQuery.eq('owner_id', params.owner_id)
    }

    // Execute all in parallel
    const [emAbertoRes, atrasadasRes, concluidasRes, tempoRes] = await Promise.all([
      emAbertoQuery,
      atrasadasQuery,
      concluidasQuery,
      tempoQuery,
    ])

    // Calcular tempo médio em dias
    let tempo_medio_dias: number | null = null
    if (tempoRes.data && tempoRes.data.length > 0) {
      const tempos = tempoRes.data
        .filter(t => t.data_conclusao && t.criado_em)
        .map(t => {
          const inicio = new Date(t.criado_em).getTime()
          const fim = new Date(t.data_conclusao!).getTime()
          return (fim - inicio) / (1000 * 60 * 60 * 24)
        })
        .filter(d => d >= 0)

      if (tempos.length > 0) {
        tempo_medio_dias = Math.round(
          (tempos.reduce((a, b) => a + b, 0) / tempos.length) * 10
        ) / 10
      }
    }

    return {
      em_aberto: emAbertoRes.count || 0,
      atrasadas: atrasadasRes.count || 0,
      concluidas: concluidasRes.count || 0,
      tempo_medio_dias,
    }
  },

  /**
   * Marca tarefa como concluída
   */
  concluir: async (tarefaId: string, observacao?: string): Promise<void> => {
    const usuarioId = await getUsuarioId()
    const role = await getUserRole()

    // Buscar tarefa para validar
    const { data: tarefa, error: fetchError } = await supabase
      .from('tarefas')
      .select('id, owner_id, status, descricao')
      .eq('id', tarefaId)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)
    if (!tarefa) throw new Error('Tarefa não encontrada')

    // Member só pode concluir suas próprias
    if (role === 'member' && tarefa.owner_id !== usuarioId) {
      throw new Error('Você não tem permissão para concluir esta tarefa')
    }

    if (tarefa.status === 'concluida') {
      throw new Error('Esta tarefa já foi concluída')
    }

    if (tarefa.status === 'cancelada') {
      throw new Error('Tarefa cancelada não pode ser concluída')
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
    }

    // Append observação se fornecida
    if (observacao) {
      const descAtual = tarefa.descricao || ''
      const separator = descAtual ? '\n\n---\nObservação de conclusão: ' : 'Observação de conclusão: '
      updatePayload.descricao = descAtual + separator + observacao
    }

    const { error } = await supabase
      .from('tarefas')
      .update(updatePayload)
      .eq('id', tarefaId)

    if (error) throw new Error(error.message)
  },

  /**
   * Lista membros do tenant para filtro de responsável (Admin)
   */
  listarMembros: async (): Promise<MembroEquipe[]> => {
    const organizacaoId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('organizacao_id', organizacaoId)
      .in('role', ['admin', 'member'])
      .eq('ativo', true)
      .order('nome')

    if (error) throw new Error(error.message)
    return (data || []) as MembroEquipe[]
  },

  /**
   * Lista funis ativos para filtro
   */
  listarFunis: async () => {
    const { data, error } = await supabase
      .from('funis')
      .select('id, nome')
      .eq('ativo', true)
      .is('arquivado', false)
      .is('deletado_em', null)
      .order('nome')

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Lista etapas de um funil para filtro
   */
  listarEtapas: async (funilId: string) => {
    const { data, error } = await supabase
      .from('etapas_funil')
      .select('id, nome')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('ordem')

    if (error) throw new Error(error.message)
    return data || []
  },
}
