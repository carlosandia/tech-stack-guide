/**
 * AIDEV-NOTE: Service API para Negócios (Funis, Etapas, Oportunidades)
 * Usa Supabase client direto (respeita RLS)
 * Conforme PRD-07 - Módulo de Negócios
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helper - Obter organizacao_id e usuario_id
// =====================================================

let _cachedOrgId: string | null = null
let _cachedUserId: string | null = null

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

supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
  _cachedUserId = null
})

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
  } | null
  responsavel?: {
    id: string
    nome: string
    sobrenome?: string | null
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
  carregarKanban: async (funilId: string, filtros?: {
    busca?: string
    responsavelId?: string
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

    // Buscar oportunidades
    let oportunidadesQuery = supabase
      .from('oportunidades')
      .select('*')
      .eq('funil_id', funilId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (filtros?.responsavelId) {
      oportunidadesQuery = oportunidadesQuery.eq('usuario_responsavel_id', filtros.responsavelId)
    }

    if (filtros?.busca) {
      oportunidadesQuery = oportunidadesQuery.ilike('titulo', `%${filtros.busca}%`)
    }

    const { data: oportunidades, error: opError } = await oportunidadesQuery

    if (opError) throw new Error(opError.message)

    const ops = (oportunidades || []) as Oportunidade[]

    // Enriquecer com contato e responsavel
    const contatoIds = [...new Set(ops.map(o => o.contato_id))]
    const responsavelIds = [...new Set(ops.filter(o => o.usuario_responsavel_id).map(o => o.usuario_responsavel_id!))]

    let contatosMap: Record<string, Oportunidade['contato']> = {}
    let responsaveisMap: Record<string, { id: string; nome: string; sobrenome?: string }> = {}

    if (contatoIds.length > 0) {
      const { data: contatos } = await supabase
        .from('contatos')
        .select('id, nome, sobrenome, email, telefone, tipo, nome_fantasia, razao_social')
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
          }
        }
      }
    }

    if (responsavelIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome')
        .in('id', responsavelIds)

      if (usuarios) {
        for (const u of usuarios) {
          responsaveisMap[u.id] = { id: u.id, nome: u.nome, sobrenome: u.sobrenome || undefined }
        }
      }
    }

    // Enriquecer oportunidades
    const opsEnriquecidas = ops.map(o => ({
      ...o,
      contato: contatosMap[o.contato_id] || null,
      responsavel: o.usuario_responsavel_id ? responsaveisMap[o.usuario_responsavel_id] || null : null,
    }))

    // Agrupar por etapa
    const etapasComOps = (etapas || []).map(etapa => {
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

  // Mover oportunidade para outra etapa
  moverEtapa: async (oportunidadeId: string, etapaDestinoId: string): Promise<void> => {
    const { error } = await supabase
      .from('oportunidades')
      .update({ etapa_id: etapaDestinoId } as any)
      .eq('id', oportunidadeId)

    if (error) throw new Error(error.message)
  },

  // Criar oportunidade
  criarOportunidade: async (payload: {
    funil_id: string
    etapa_id: string
    contato_id: string
    titulo: string
    valor?: number
    usuario_responsavel_id?: string
    previsao_fechamento?: string
    observacoes?: string
  }): Promise<Oportunidade> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('oportunidades')
      .insert({
        organizacao_id: organizacaoId,
        funil_id: payload.funil_id,
        etapa_id: payload.etapa_id,
        contato_id: payload.contato_id,
        titulo: payload.titulo,
        valor: payload.valor || null,
        usuario_responsavel_id: payload.usuario_responsavel_id || userId,
        previsao_fechamento: payload.previsao_fechamento || null,
        observacoes: payload.observacoes || null,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Oportunidade
  },

  // Fechar oportunidade (ganho/perda)
  fecharOportunidade: async (
    oportunidadeId: string,
    _tipo: 'ganho' | 'perda',
    etapaDestinoId: string,
    motivoId?: string,
    observacoes?: string
  ): Promise<void> => {
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
  criarContatoRapido: async (payload: {
    tipo: 'pessoa' | 'empresa'
    nome?: string
    sobrenome?: string
    email?: string
    telefone?: string
    nome_fantasia?: string
  }): Promise<{ id: string }> => {
    const organizacaoId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const insertData: Record<string, unknown> = {
      organizacao_id: organizacaoId,
      tipo: payload.tipo,
      criado_por: userId,
      origem: 'manual',
    }

    if (payload.nome) insertData.nome = payload.nome
    if (payload.sobrenome) insertData.sobrenome = payload.sobrenome
    if (payload.email) insertData.email = payload.email
    if (payload.telefone) insertData.telefone = payload.telefone
    if (payload.nome_fantasia) insertData.nome_fantasia = payload.nome_fantasia

    const { data, error } = await supabase
      .from('contatos')
      .insert(insertData as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return { id: data.id }
  },

  // Listar produtos do tenant
  listarProdutos: async (busca?: string): Promise<Array<{
    id: string
    nome: string
    preco: number
    sku?: string | null
  }>> => {
    let query = supabase
      .from('produtos')
      .select('id, nome, preco, sku')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('nome', { ascending: true })
      .limit(20)

    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,sku.ilike.%${busca}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
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
}
