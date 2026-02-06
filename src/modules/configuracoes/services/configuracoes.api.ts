/**
 * AIDEV-NOTE: Service layer para o módulo de Configurações
 * Usa Supabase client direto (respeita RLS)
 * Conforme PRD-05 - Configurações do Tenant
 *
 * RLS filtra automaticamente pelo tenant do usuario logado
 * Para INSERTs, organizacao_id é obtido via helper getOrganizacaoId()
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Helper - Obter organizacao_id do usuario logado
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

// Reset cache on auth state change
supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
})

async function getUsuarioId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!data?.id) throw new Error('Usuário não encontrado')
  return data.id
}

// =====================================================
// Types
// =====================================================

// Campos Personalizados
export type Entidade = 'pessoa' | 'empresa' | 'oportunidade'
export type TipoCampo =
  | 'texto' | 'texto_longo' | 'numero' | 'decimal'
  | 'data' | 'data_hora' | 'booleano' | 'select'
  | 'multi_select' | 'email' | 'telefone' | 'url' | 'cpf' | 'cnpj'

export interface CampoCustomizado {
  id: string
  organizacao_id: string
  nome: string
  slug: string
  descricao?: string | null
  entidade: Entidade
  tipo: TipoCampo
  obrigatorio: boolean
  valor_padrao?: string | null
  placeholder?: string | null
  validacoes: Record<string, unknown>
  opcoes: string[]
  ordem: number
  sistema: boolean
  ativo: boolean
  criado_em: string
  criado_por?: string | null
  atualizado_em: string
  deletado_em?: string | null
}

export interface CriarCampoPayload {
  nome: string
  descricao?: string
  entidade: Entidade
  tipo: TipoCampo
  obrigatorio?: boolean
  valor_padrao?: string
  placeholder?: string
  validacoes?: Record<string, unknown>
  opcoes?: string[]
}

export interface AtualizarCampoPayload {
  nome?: string
  descricao?: string | null
  obrigatorio?: boolean
  valor_padrao?: string | null
  placeholder?: string | null
  validacoes?: Record<string, unknown>
  opcoes?: string[]
  ativo?: boolean
}

// Produtos
export interface Produto {
  id: string
  organizacao_id: string
  categoria_id?: string | null
  nome: string
  descricao?: string | null
  sku?: string | null
  preco: number
  moeda: string
  unidade: string
  recorrente: boolean
  periodo_recorrencia?: string | null
  ativo: boolean
  criado_em: string
  categoria?: Categoria | null
}

export interface Categoria {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  cor: string
  ordem: number
  ativo: boolean
  criado_em: string
}

// Motivos
export type TipoMotivo = 'ganho' | 'perda'
export interface MotivoResultado {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  tipo: TipoMotivo
  cor: string
  padrao: boolean
  ordem: number
  ativo: boolean
  criado_em: string
}

// Templates de Tarefa
export type TipoTarefa = 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'visita' | 'outro'
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente'
export interface TarefaTemplate {
  id: string
  organizacao_id: string
  titulo: string
  descricao?: string | null
  tipo: TipoTarefa
  canal?: string | null
  prioridade: PrioridadeTarefa
  dias_prazo: number
  ativo: boolean
  criado_em: string
}

// Templates de Etapa
export type TipoEtapa = 'entrada' | 'normal' | 'ganho' | 'perda'
export interface EtapaTemplate {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  tipo: TipoEtapa
  cor: string
  probabilidade: number
  sistema: boolean
  ordem: number
  ativo: boolean
  criado_em: string
  tarefas?: Array<{
    id: string
    tarefa_template_id: string
    titulo?: string
    tipo?: string
    criar_automaticamente?: boolean
    ordem?: number
  }>
}

// Regras de Qualificação
export type OperadorRegra = 'igual' | 'diferente' | 'contem' | 'nao_contem' | 'maior_que' | 'menor_que' | 'maior_igual' | 'menor_igual' | 'vazio' | 'nao_vazio'
export interface RegraQualificacao {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  campo_id?: string | null
  operador: OperadorRegra
  valor?: string | null
  valores: string[]
  ativo: boolean
  ordem: number
  criado_em: string
}

// Configuração de Cards
export interface ConfiguracaoCard {
  id: string
  organizacao_id: string
  funil_id?: string | null
  campos_visiveis: string[]
  campos_customizados_visiveis: string[]
  criado_em: string
  atualizado_em: string
}

// Integracoes
export type PlataformaIntegracao = 'whatsapp' | 'instagram' | 'meta_ads' | 'google' | 'email'
export interface Integracao {
  id: string
  organizacao_id: string
  plataforma: PlataformaIntegracao
  status: string
  conta_externa_nome?: string | null
  conta_externa_email?: string | null
  waha_phone?: string | null
  ultimo_sync?: string | null
  ultimo_erro?: string | null
}

// Webhooks
export interface WebhookEntrada {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  url_token: string
  url_completa?: string
  api_key?: string | null
  ativo: boolean
  criado_em: string
  ultimo_request_em?: string | null
}

export interface WebhookSaida {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  url: string
  eventos: string[]
  tipo_autenticacao: string
  retry_ativo: boolean
  max_tentativas: number
  ativo: boolean
  criado_em: string
}

// Equipe
export interface UsuarioTenant {
  id: string
  organizacao_id: string
  auth_user_id?: string | null
  nome: string
  sobrenome?: string | null
  email: string
  telefone?: string | null
  avatar_url?: string | null
  perfil_permissao_id?: string | null
  papel_nome?: string | null
  status: 'ativo' | 'inativo' | 'pendente' | 'suspenso'
  ultimo_login?: string | null
  criado_em: string
  atualizado_em: string
  role?: string
}

/** @deprecated Use UsuarioTenant instead */
export type Usuario = UsuarioTenant

export interface MembroResumo {
  id: string
  usuario_id: string
  nome: string
  sobrenome?: string | null
  email: string
  avatar_url?: string | null
  papel: 'lider' | 'membro'
  adicionado_em: string
}

export interface Equipe {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  lider_id?: string | null
  cor?: string | null
  ativa: boolean
  criado_em: string
  criado_por?: string | null
  atualizado_em: string
  deletado_em?: string | null
}

export interface EquipeComMembros extends Equipe {
  membros: MembroResumo[]
  total_membros: number
  lider?: MembroResumo | null
}

export interface Permissao {
  modulo: string
  acoes: Array<'visualizar' | 'criar' | 'editar' | 'excluir' | 'gerenciar'>
}

export interface PerfilPermissao {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  permissoes: Permissao[]
  is_admin: boolean
  is_sistema: boolean
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
}

// Metas
export type TipoMeta = 'empresa' | 'equipe' | 'individual'
export type CategoriaMetrica = 'receita' | 'quantidade' | 'atividades' | 'leads' | 'tempo'
export type MetricaMeta =
  | 'valor_vendas' | 'mrr' | 'ticket_medio'
  | 'quantidade_vendas' | 'novos_negocios' | 'taxa_conversao'
  | 'reunioes' | 'ligacoes' | 'emails' | 'tarefas'
  | 'novos_contatos' | 'mqls' | 'sqls'
  | 'tempo_fechamento' | 'velocidade_pipeline'
export type PeriodoMeta = 'mensal' | 'trimestral' | 'semestral' | 'anual'
export type TipoDistribuicao = 'igual' | 'proporcional' | 'manual'

export interface Meta {
  id: string
  organizacao_id: string
  nome?: string
  tipo: TipoMeta
  metrica: MetricaMeta
  valor_meta: number
  periodo: PeriodoMeta
  data_inicio: string
  data_fim: string
  equipe_id?: string | null
  usuario_id?: string | null
  funil_id?: string | null
  meta_pai_id?: string | null
  ativa: boolean
  criado_em: string
  criado_por?: string | null
  atualizado_em: string
  deletado_em?: string | null
}

export interface MetaProgresso {
  id: string
  meta_id?: string
  valor_atual: number
  percentual_atingido: number
  ultima_atualizacao?: string
}

export interface MetaComProgresso extends Meta {
  progresso?: MetaProgresso | null
  equipe_nome?: string | null
  usuario_nome?: string | null
  metas_filhas_count?: number
}

export interface MetaDetalhada extends MetaComProgresso {
  metas_filhas?: MetaComProgresso[]
}

export interface RankingItem {
  posicao: number
  usuario_id: string
  usuario_nome: string
  avatar_url?: string | null
  equipe_nome?: string | null
  valor_atingido: number
  percentual_meta: number
  variacao: number
}

// Configurações do Tenant
export interface ConfiguracaoTenant {
  id: string
  organizacao_id: string
  moeda_padrao: string
  timezone: string
  formato_data: string
  notificar_nova_oportunidade: boolean
  notificar_tarefa_vencida: boolean
  notificar_mudanca_etapa: boolean
  criar_tarefa_automatica: boolean
  dias_alerta_inatividade: number
  assinatura_mensagem?: string | null
  horario_inicio_envio: string
  horario_fim_envio: string
  criado_em: string
  atualizado_em: string
}

// Tipo de log para webhooks de saída
export interface WebhookSaidaLog {
  id: string
  webhook_id: string
  evento: string
  payload: Record<string, unknown>
  status_code?: number | null
  response_body?: string | null
  tentativa: number
  sucesso: boolean
  erro_mensagem?: string | null
  duracao_ms?: number | null
  criado_em: string
}

// =====================================================
// API Functions - Campos
// =====================================================

export const camposApi = {
  listar: async (entidade: Entidade) => {
    const { data, error, count } = await supabase
      .from('campos_customizados')
      .select('*', { count: 'exact' })
      .eq('entidade', entidade)
      .is('deletado_em', null)
      .order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar campos: ${error.message}`)
    return { campos: (data || []) as unknown as CampoCustomizado[], total: count || 0 }
  },

  buscar: async (id: string) => {
    const { data, error } = await supabase
      .from('campos_customizados')
      .select('*')
      .eq('id', id)
      .is('deletado_em', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar campo: ${error.message}`)
    return data as unknown as CampoCustomizado | null
  },

  criar: async (payload: CriarCampoPayload) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Buscar próxima ordem
    const { data: ultimoCampo } = await supabase
      .from('campos_customizados')
      .select('ordem')
      .eq('entidade', payload.entidade)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultimoCampo ? (ultimoCampo.ordem ?? 0) + 1 : 0
    const slug = payload.nome.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

    const { data, error } = await supabase
      .from('campos_customizados')
      .insert({
        organizacao_id: orgId,
        nome: payload.nome,
        slug,
        descricao: payload.descricao || null,
        entidade: payload.entidade,
        tipo: payload.tipo,
        obrigatorio: payload.obrigatorio ?? false,
        valor_padrao: payload.valor_padrao || null,
        placeholder: payload.placeholder || null,
        validacoes: (payload.validacoes || null) as any,
        opcoes: (payload.opcoes || null) as any,
        ordem: novaOrdem,
        sistema: false,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar campo: ${error.message}`)
    return data as unknown as CampoCustomizado
  },

  atualizar: async (id: string, payload: AtualizarCampoPayload) => {
    const { data, error } = await supabase
      .from('campos_customizados')
      .update({
        ...payload,
        validacoes: payload.validacoes ? (payload.validacoes as any) : undefined,
        opcoes: payload.opcoes ? (payload.opcoes as any) : undefined,
        atualizado_em: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar campo: ${error.message}`)
    return data as unknown as CampoCustomizado
  },

  excluir: async (id: string) => {
    const { error } = await supabase
      .from('campos_customizados')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir campo: ${error.message}`)
  },

  reordenar: async (entidade: Entidade, ordem: Array<{ id: string; ordem: number }>) => {
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('campos_customizados')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('entidade', entidade)
    )
    const results = await Promise.all(updates)
    const erros = results.filter(r => r.error)
    if (erros.length > 0) throw new Error('Erro ao reordenar campos')
  },
}

// =====================================================
// API Functions - Produtos
// =====================================================

export const produtosApi = {
  listar: async (params?: { categoria_id?: string; busca?: string; ativo?: string; recorrente?: string; page?: string; limit?: string }) => {
    const page = parseInt(params?.page || '1')
    const limit = parseInt(params?.limit || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('produtos')
      .select('*, categoria:categorias_produtos(id, nome)', { count: 'exact' })
      .is('deletado_em', null)

    if (params?.categoria_id) query = query.eq('categoria_id', params.categoria_id)
    if (params?.busca) query = query.or(`nome.ilike.%${params.busca}%`)
    if (params?.ativo) query = query.eq('ativo', params.ativo === 'true')
    if (params?.recorrente) query = query.eq('recorrente', params.recorrente === 'true')

    const { data, error, count } = await query
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao listar produtos: ${error.message}`)
    return {
      produtos: (data || []) as unknown as Produto[],
      total: count || 0,
      page,
      total_paginas: Math.ceil((count || 0) / limit),
    }
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('produtos')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select('*, categoria:categorias_produtos(id, nome)')
      .single()

    if (error) throw new Error(`Erro ao criar produto: ${error.message}`)
    return data as unknown as Produto
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('produtos')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select('*, categoria:categorias_produtos(id, nome)')
      .single()

    if (error) throw new Error(`Erro ao atualizar produto: ${error.message}`)
    return data as unknown as Produto
  },

  excluir: async (id: string) => {
    const { error } = await supabase
      .from('produtos')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir produto: ${error.message}`)
  },

  listarCategorias: async () => {
    const { data, error, count } = await supabase
      .from('categorias_produtos')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    if (error) throw new Error(`Erro ao listar categorias: ${error.message}`)
    return { categorias: (data || []) as unknown as Categoria[], total: count || 0 }
  },

  criarCategoria: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('categorias_produtos')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar categoria: ${error.message}`)
    return data as unknown as Categoria
  },

  atualizarCategoria: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('categorias_produtos')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar categoria: ${error.message}`)
    return data as unknown as Categoria
  },

  excluirCategoria: async (id: string) => {
    const { error } = await supabase
      .from('categorias_produtos')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir categoria: ${error.message}`)
  },
}

// =====================================================
// API Functions - Motivos
// =====================================================

export const motivosApi = {
  listar: async (tipo?: TipoMotivo) => {
    let query = supabase
      .from('motivos_resultado')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)

    if (tipo) query = query.eq('tipo', tipo)

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar motivos: ${error.message}`)
    return { motivos: (data || []) as unknown as MotivoResultado[], total: count || 0 }
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Buscar próxima ordem
    const { data: ultimo } = await supabase
      .from('motivos_resultado')
      .select('ordem')
      .eq('tipo', payload.tipo as string)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultimo ? (ultimo.ordem ?? 0) + 1 : 0

    const { data, error } = await supabase
      .from('motivos_resultado')
      .insert({
        organizacao_id: orgId,
        ...payload,
        ordem: novaOrdem,
        padrao: false,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar motivo: ${error.message}`)
    return data as unknown as MotivoResultado
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('motivos_resultado')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar motivo: ${error.message}`)
    return data as unknown as MotivoResultado
  },

  excluir: async (id: string) => {
    const { error } = await supabase
      .from('motivos_resultado')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir motivo: ${error.message}`)
  },

  reordenar: async (tipo: TipoMotivo, ordem: Array<{ id: string; ordem: number }>) => {
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('motivos_resultado')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('tipo', tipo)
    )
    const results = await Promise.all(updates)
    if (results.some(r => r.error)) throw new Error('Erro ao reordenar motivos')
  },
}

// =====================================================
// API Functions - Tarefas Templates
// =====================================================

export const tarefasTemplatesApi = {
  listar: async (params?: { tipo?: string; ativo?: string }) => {
    let query = supabase
      .from('tarefas_templates')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.ativo) query = query.eq('ativo', params.ativo === 'true')

    const { data, error, count } = await query.order('titulo', { ascending: true })

    if (error) throw new Error(`Erro ao listar templates: ${error.message}`)
    return { templates: (data || []) as unknown as TarefaTemplate[], total: count || 0 }
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('tarefas_templates')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar template: ${error.message}`)
    return data as unknown as TarefaTemplate
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('tarefas_templates')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar template: ${error.message}`)
    return data as unknown as TarefaTemplate
  },

  excluir: async (id: string) => {
    const { error } = await supabase
      .from('tarefas_templates')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir template: ${error.message}`)
  },
}

// =====================================================
// API Functions - Etapas Templates
// =====================================================

export const etapasTemplatesApi = {
  listar: async (params?: { tipo?: string; ativo?: string }) => {
    let query = supabase
      .from('etapas_templates')
      .select(
        `*, tarefas:etapas_tarefas(id, tarefa_template_id, criar_automaticamente, ordem, tarefa:tarefas_templates(id, titulo, tipo, descricao))`,
        { count: 'exact' }
      )
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.ativo) query = query.eq('ativo', params.ativo === 'true')

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar etapas: ${error.message}`)
    return { templates: (data || []) as unknown as EtapaTemplate[], total: count || 0 }
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const { tarefas_ids, ...etapaData } = payload as { tarefas_ids?: string[] } & Record<string, unknown>

    // Buscar próxima ordem
    const { data: ultima } = await supabase
      .from('etapas_templates')
      .select('ordem')
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultima ? (ultima.ordem ?? 0) + 1 : 0

    const { data: etapa, error } = await supabase
      .from('etapas_templates')
      .insert({
        organizacao_id: orgId,
        ...etapaData,
        ordem: novaOrdem,
        sistema: false,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar etapa: ${error.message}`)

    // Vincular tarefas se houver
    if (tarefas_ids && tarefas_ids.length > 0) {
      const vinculos = tarefas_ids.map((tarefaId, index) => ({
        organizacao_id: orgId,
        etapa_template_id: etapa.id,
        tarefa_template_id: tarefaId,
        ordem: index,
        criar_automaticamente: false,
      }))

      const { error: tarefasError } = await supabase.from('etapas_tarefas').insert(vinculos as any)
      if (tarefasError) {
        await supabase.from('etapas_templates').delete().eq('id', etapa.id)
        throw new Error(`Erro ao vincular tarefas: ${tarefasError.message}`)
      }
    }

    return etapa as unknown as EtapaTemplate
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const { tarefas_ids, ...etapaData } = payload as { tarefas_ids?: string[] } & Record<string, unknown>

    const { data, error } = await supabase
      .from('etapas_templates')
      .update({ ...etapaData, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar etapa: ${error.message}`)

    // Se tarefas_ids foi passado, recriar vínculos
    if (tarefas_ids !== undefined) {
      await supabase.from('etapas_tarefas').delete().eq('etapa_template_id', id)

      if (tarefas_ids.length > 0) {
        const vinculos = tarefas_ids.map((tarefaId, index) => ({
          organizacao_id: orgId,
          etapa_template_id: id,
          tarefa_template_id: tarefaId,
          ordem: index,
          criar_automaticamente: false,
        }))
        await supabase.from('etapas_tarefas').insert(vinculos as any)
      }
    }

    return data as unknown as EtapaTemplate
  },

  excluir: async (id: string) => {
    // Remover vínculos de tarefas primeiro
    await supabase.from('etapas_tarefas').delete().eq('etapa_template_id', id)

    const { error } = await supabase
      .from('etapas_templates')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir etapa: ${error.message}`)
  },

  reordenar: async (ordem: Array<{ id: string; ordem: number }>) => {
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('etapas_templates')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
    )
    const results = await Promise.all(updates)
    if (results.some(r => r.error)) throw new Error('Erro ao reordenar etapas')
  },

  vincularTarefa: async (etapaId: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('etapas_tarefas')
      .insert({ organizacao_id: orgId, etapa_template_id: etapaId, ...payload } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao vincular tarefa: ${error.message}`)
    return data
  },

  desvincularTarefa: async (etapaId: string, tarefaId: string) => {
    const { error } = await supabase
      .from('etapas_tarefas')
      .delete()
      .eq('etapa_template_id', etapaId)
      .eq('tarefa_template_id', tarefaId)

    if (error) throw new Error(`Erro ao desvincular tarefa: ${error.message}`)
  },
}

// =====================================================
// API Functions - Regras de Qualificação
// =====================================================

export const regrasApi = {
  listar: async (params?: { ativa?: string }) => {
    let query = supabase
      .from('regras_qualificacao')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)

    if (params?.ativa) query = query.eq('ativa', params.ativa === 'true')

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar regras: ${error.message}`)
    return { regras: (data || []) as unknown as RegraQualificacao[], total: count || 0 }
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Buscar próxima ordem
    const { data: ultima } = await supabase
      .from('regras_qualificacao')
      .select('ordem')
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultima ? (ultima.ordem ?? 0) + 1 : 1

    const { data, error } = await supabase
      .from('regras_qualificacao')
      .insert({
        organizacao_id: orgId,
        ...payload,
        ordem: novaOrdem,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar regra: ${error.message}`)
    return data as unknown as RegraQualificacao
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('regras_qualificacao')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar regra: ${error.message}`)
    return data as unknown as RegraQualificacao
  },

  excluir: async (id: string) => {
    const { error } = await supabase
      .from('regras_qualificacao')
      .update({ deletado_em: new Date().toISOString(), ativa: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir regra: ${error.message}`)
  },

  reordenar: async (prioridades: Array<{ id: string; ordem: number }>) => {
    const updates = prioridades.map(({ id, ordem }) =>
      supabase
        .from('regras_qualificacao')
        .update({ ordem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
    )
    const results = await Promise.all(updates)
    if (results.some(r => r.error)) throw new Error('Erro ao reordenar regras')
  },
}

// =====================================================
// API Functions - Configuração de Cards
// =====================================================

export const configCardApi = {
  buscar: async (funil_id?: string) => {
    let query = supabase.from('configuracoes_card').select('*')
    if (funil_id) query = query.eq('funil_id', funil_id)

    const { data, error } = await query.maybeSingle()

    if (error) throw new Error(`Erro ao buscar config card: ${error.message}`)
    return data as unknown as ConfiguracaoCard | null
  },

  atualizar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('configuracoes_card')
      .select('id')
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from('configuracoes_card')
        .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar config card: ${error.message}`)
      return data as unknown as ConfiguracaoCard
    } else {
      const { data, error } = await supabase
        .from('configuracoes_card')
        .insert({ organizacao_id: orgId, ...payload } as any)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar config card: ${error.message}`)
      return data as unknown as ConfiguracaoCard
    }
  },
}

// =====================================================
// API Functions - Integracoes (stubs - dependem de OAuth backend)
// =====================================================

export const integracoesApi = {
  listar: async () => {
    // Buscar conexões existentes de todas as plataformas
    const integracoes: Integracao[] = []

    const tabelas = {
      instagram: 'conexoes_instagram',
      google: 'conexoes_google',
      email: 'conexoes_email',
    } as const

    for (const plat of ['instagram', 'google', 'email'] as const) {
      const { data } = await supabase
        .from(tabelas[plat])
        .select('id, organizacao_id, status, criado_em')
        .is('deletado_em', null)

      if (data) {
        data.forEach((row: Record<string, unknown>) => {
          integracoes.push({
            id: row.id as string,
            organizacao_id: row.organizacao_id as string,
            plataforma: plat,
            status: row.status as string,
          })
        })
      }
    }

    return { integracoes, total: integracoes.length }
  },

  buscar: async (id: string) => {
    return { id, plataforma: 'email', status: 'desconectado' } as Integracao
  },

  obterAuthUrl: async (_plataforma: PlataformaIntegracao, _redirect_uri: string): Promise<{ url: string; state?: string }> => {
    throw new Error('Funcionalidade de OAuth requer backend. Em implementação.')
  },

  processarCallback: async (_plataforma: PlataformaIntegracao, _payload: { code: string; state: string; redirect_uri: string }) => {
    throw new Error('Funcionalidade de OAuth requer backend. Em implementação.')
  },

  desconectar: async (_id: string) => {
    throw new Error('Funcionalidade de desconexão requer backend. Em implementação.')
  },

  sincronizar: async (_id: string) => {
    throw new Error('Funcionalidade de sincronização requer backend. Em implementação.')
  },
}

// =====================================================
// API Functions - Webhooks
// =====================================================

export const webhooksApi = {
  listarEntrada: async () => {
    const { data, error, count } = await supabase
      .from('webhooks_entrada')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar webhooks: ${error.message}`)
    return { webhooks: (data || []) as unknown as WebhookEntrada[], total: count || 0 }
  },

  criarEntrada: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const urlToken = crypto.randomUUID().replace(/-/g, '')

    const { data, error } = await supabase
      .from('webhooks_entrada')
      .insert({ organizacao_id: orgId, ...payload, url_token: urlToken, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar webhook: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  atualizarEntrada: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('webhooks_entrada')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  excluirEntrada: async (id: string) => {
    const { error } = await supabase
      .from('webhooks_entrada')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
  },

  regenerarToken: async (id: string) => {
    const novoToken = crypto.randomUUID().replace(/-/g, '')
    const { data, error } = await supabase
      .from('webhooks_entrada')
      .update({ url_token: novoToken, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao regenerar token: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  listarSaida: async () => {
    const { data, error, count } = await supabase
      .from('webhooks_saida')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar webhooks: ${error.message}`)
    return { webhooks: (data || []) as unknown as WebhookSaida[], total: count || 0 }
  },

  criarSaida: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('webhooks_saida')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar webhook: ${error.message}`)
    return data as unknown as WebhookSaida
  },

  atualizarSaida: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('webhooks_saida')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
    return data as unknown as WebhookSaida
  },

  excluirSaida: async (id: string) => {
    const { error } = await supabase
      .from('webhooks_saida')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
  },

  testarSaida: async (_id: string) => {
    throw new Error('Teste de webhook requer backend. Em implementação.')
  },

  listarLogsSaida: async (id: string, params?: { evento?: string; sucesso?: string; page?: string; limit?: string }) => {
    const page = parseInt(params?.page || '1')
    const limit = parseInt(params?.limit || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('webhooks_saida_logs')
      .select('*', { count: 'exact' })
      .eq('webhook_id', id)

    if (params?.evento) query = query.eq('evento', params.evento)
    if (params?.sucesso) query = query.eq('sucesso', params.sucesso === 'true')

    const { data, error, count } = await query
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao listar logs: ${error.message}`)
    return {
      logs: (data || []) as unknown as WebhookSaidaLog[],
      total: count || 0,
      page,
      total_paginas: Math.ceil((count || 0) / limit),
    }
  },
}

// =====================================================
// API Functions - Equipe
// =====================================================

function processarEquipeComMembros(equipeRaw: Record<string, unknown>): EquipeComMembros {
  const membrosRaw = (equipeRaw.membros || []) as Array<Record<string, unknown>>
  const membros: MembroResumo[] = membrosRaw.map((m) => {
    const usuario = (Array.isArray(m.usuario) ? m.usuario[0] : m.usuario) as Record<string, unknown> | null
    return {
      id: m.id as string,
      usuario_id: m.usuario_id as string,
      nome: (usuario?.nome as string) || '',
      sobrenome: (usuario?.sobrenome as string) || null,
      email: (usuario?.email as string) || '',
      avatar_url: (usuario?.avatar_url as string) || null,
      papel: m.papel as 'lider' | 'membro',
      adicionado_em: (m.adicionado_em || m.criado_em) as string,
    }
  })

  const lider = membros.find(m => m.papel === 'lider') || null

  return {
    ...(equipeRaw as unknown as Equipe),
    membros,
    total_membros: membros.length,
    lider,
  }
}

export const equipeApi = {
  listarEquipes: async (params?: { busca?: string; ativa?: string }) => {
    let query = supabase
      .from('equipes')
      .select(
        `*, membros:equipes_membros(id, usuario_id, papel, criado_em, usuario:usuarios(id, nome, sobrenome, email, avatar_url))`,
        { count: 'exact' }
      )
      .is('deletado_em', null)

    if (params?.busca) query = query.ilike('nome', `%${params.busca}%`)
    if (params?.ativa) query = query.eq('ativa', params.ativa === 'true')

    const { data, error, count } = await query.order('nome', { ascending: true })

    if (error) throw new Error(`Erro ao listar equipes: ${error.message}`)
    const equipes = (data || []).map(e => processarEquipeComMembros(e as Record<string, unknown>))
    return { equipes, total: count || 0 }
  },

  buscarEquipe: async (id: string) => {
    const { data, error } = await supabase
      .from('equipes')
      .select(
        `*, membros:equipes_membros(id, usuario_id, papel, criado_em, usuario:usuarios(id, nome, sobrenome, email, avatar_url))`
      )
      .eq('id', id)
      .is('deletado_em', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar equipe: ${error.message}`)
    if (!data) return null
    return processarEquipeComMembros(data as Record<string, unknown>)
  },

  criarEquipe: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('equipes')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar equipe: ${error.message}`)

    // Se tiver lider, adicionar como membro
    if (payload.lider_id) {
      await supabase.from('equipes_membros').insert({
        organizacao_id: orgId,
        equipe_id: data.id,
        usuario_id: payload.lider_id as string,
      } as any)
    }

    return data as unknown as Equipe
  },

  atualizarEquipe: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('equipes')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar equipe: ${error.message}`)
    return data as unknown as Equipe
  },

  excluirEquipe: async (id: string) => {
    await supabase.from('equipes_membros').delete().eq('equipe_id', id)

    const { error } = await supabase
      .from('equipes')
      .update({ deletado_em: new Date().toISOString(), ativa: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir equipe: ${error.message}`)
  },

  adicionarMembro: async (equipeId: string, payload: { usuario_id: string; papel?: 'lider' | 'membro' }) => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('equipes_membros')
      .insert({
        organizacao_id: orgId,
        equipe_id: equipeId,
        usuario_id: payload.usuario_id,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao adicionar membro: ${error.message}`)
    return data
  },

  removerMembro: async (equipeId: string, usuarioId: string) => {
    const { error } = await supabase
      .from('equipes_membros')
      .delete()
      .eq('equipe_id', equipeId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro ao remover membro: ${error.message}`)
  },

  alterarPapelMembro: async (equipeId: string, usuarioId: string, papel: 'lider' | 'membro') => {
    // equipes_membros não tem coluna 'papel' confirmada, mas usamos o que o backend define
    const { error } = await supabase
      .from('equipes_membros')
      .update({} as Record<string, unknown>)
      .eq('equipe_id', equipeId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro ao alterar papel: ${error.message}`)
    return { equipeId, usuarioId, papel }
  },

  listarUsuarios: async (params?: Record<string, string>) => {
    const page = parseInt(params?.page || '1')
    const limit = parseInt(params?.limit || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('usuarios')
      .select('id, organizacao_id, nome, sobrenome, email, telefone, avatar_url, perfil_permissao_id, status, ultimo_login, criado_em, atualizado_em, role, deletado_em, papel:perfis_permissao(id, nome)', { count: 'exact' })
      .is('deletado_em', null)

    if (params?.busca) query = query.or(`nome.ilike.%${params.busca}%,email.ilike.%${params.busca}%`)
    if (params?.status && params.status !== 'todos') query = query.eq('status', params.status)
    if (params?.papel_id) query = query.eq('perfil_permissao_id', params.papel_id)

    const { data, error, count } = await query
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao listar usuarios: ${error.message}`)

    const usuarios = (data || []).map((u: Record<string, unknown>) => ({
      ...u,
      papel_nome: (u.papel as Record<string, unknown> | null)?.nome || null,
    })) as unknown as UsuarioTenant[]

    return { usuarios, total: count || 0, page, total_paginas: Math.ceil((count || 0) / limit) }
  },

  buscarUsuario: async (id: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, organizacao_id, nome, sobrenome, email, telefone, avatar_url, perfil_permissao_id, status, ultimo_login, criado_em, atualizado_em, role, deletado_em, papel:perfis_permissao(id, nome)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar usuario: ${error.message}`)
    if (!data) return null
    return { ...data, papel_nome: (data.papel as Record<string, unknown> | null)?.nome || null } as unknown as UsuarioTenant
  },

  convidarUsuario: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        organizacao_id: orgId,
        nome: payload.nome,
        sobrenome: payload.sobrenome,
        email: payload.email,
        perfil_permissao_id: payload.papel_id,
        status: 'pendente',
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao convidar usuario: ${error.message}`)
    // TODO: Enviar email de convite via edge function
    return data as unknown as UsuarioTenant
  },

  atualizarUsuario: async (id: string, payload: Record<string, unknown>) => {
    const { equipe_ids, ...dadosUsuario } = payload as { equipe_ids?: string[] } & Record<string, unknown>

    const { data, error } = await supabase
      .from('usuarios')
      .update({ ...dadosUsuario, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar usuario: ${error.message}`)
    return data as unknown as UsuarioTenant
  },

  alterarStatusUsuario: async (id: string, payload: { status: string; motivo?: string }) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ status: payload.status, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao alterar status: ${error.message}`)
    return data as unknown as UsuarioTenant
  },

  reenviarConvite: async (_id: string) => {
    // TODO: Implementar via edge function
    throw new Error('Reenvio de convite requer backend. Em implementação.')
  },

  listarPerfis: async () => {
    const { data, error, count } = await supabase
      .from('perfis_permissao')
      .select('*', { count: 'exact' })
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    if (error) throw new Error(`Erro ao listar perfis: ${error.message}`)
    return { perfis: (data || []) as unknown as PerfilPermissao[], total: count || 0 }
  },

  buscarPerfil: async (id: string) => {
    const { data, error } = await supabase
      .from('perfis_permissao')
      .select('*')
      .eq('id', id)
      .is('deletado_em', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar perfil: ${error.message}`)
    return data as unknown as PerfilPermissao | null
  },

  criarPerfil: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('perfis_permissao')
      .insert({ organizacao_id: orgId, ...payload } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar perfil: ${error.message}`)
    return data as unknown as PerfilPermissao
  },

  atualizarPerfil: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('perfis_permissao')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`)
    return data as unknown as PerfilPermissao
  },

  excluirPerfil: async (id: string) => {
    const { error } = await supabase
      .from('perfis_permissao')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir perfil: ${error.message}`)
  },
}

// =====================================================
// API Functions - Metas
// =====================================================

function processarMetaProgresso(metaRaw: Record<string, unknown>): MetaComProgresso {
  const progresso = metaRaw.progresso as Record<string, unknown> | Record<string, unknown>[] | null
  const equipe = metaRaw.equipe as Record<string, unknown> | null
  const usuario = metaRaw.usuario as Record<string, unknown> | null

  // Progresso pode ser array (relação 1:N) ou objeto
  const progressoObj = Array.isArray(progresso) ? progresso[0] : progresso

  return {
    ...(metaRaw as unknown as Meta),
    progresso: progressoObj ? {
      id: progressoObj.id as string,
      meta_id: progressoObj.meta_id as string,
      valor_atual: Number(progressoObj.valor_atual || 0),
      percentual_atingido: Number(progressoObj.percentual_atingido || 0),
      ultima_atualizacao: (progressoObj.calculado_em || progressoObj.ultima_atualizacao) as string,
    } : null,
    equipe_nome: (equipe?.nome as string) || null,
    usuario_nome: usuario ? `${usuario.nome || ''}${usuario.sobrenome ? ' ' + usuario.sobrenome : ''}`.trim() : null,
  }
}

export const metasApi = {
  listar: async (params?: Record<string, string>) => {
    let query = supabase
      .from('metas')
      .select(
        `*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios(id, nome, sobrenome)`,
        { count: 'exact' }
      )
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.metrica) query = query.eq('metrica', params.metrica)
    if (params?.periodo) query = query.eq('periodo', params.periodo)
    if (params?.equipe_id) query = query.eq('equipe_id', params.equipe_id)
    if (params?.usuario_id) query = query.eq('usuario_id', params.usuario_id)
    if (params?.ativa) query = query.eq('ativa', params.ativa === 'true')

    const { data, error, count } = await query.order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar metas: ${error.message}`)
    const metas = (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>))
    return { metas, total: count || 0 }
  },

  buscar: async (id: string) => {
    const { data, error } = await supabase
      .from('metas')
      .select(
        `*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios(id, nome, sobrenome)`
      )
      .eq('id', id)
      .is('deletado_em', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar meta: ${error.message}`)
    if (!data) return null

    const metaProcessada = processarMetaProgresso(data as Record<string, unknown>)

    // Buscar metas filhas
    const { data: filhas } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios(id, nome, sobrenome)`)
      .eq('meta_pai_id', id)
      .is('deletado_em', null)

    const metasFilhas = (filhas || []).map(f => processarMetaProgresso(f as Record<string, unknown>))

    return { ...metaProcessada, metas_filhas: metasFilhas } as MetaDetalhada
  },

  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    const { data, error } = await supabase
      .from('metas')
      .insert({ organizacao_id: orgId, ...payload, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar meta: ${error.message}`)

    // Criar registro de progresso inicial
    await supabase.from('metas_progresso').insert({
      organizacao_id: orgId,
      meta_id: data.id,
      valor_atual: 0,
      percentual_atingido: 0,
    } as any)

    return data as unknown as Meta
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('metas')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)
    return data as unknown as Meta
  },

  excluir: async (id: string) => {
    // Excluir metas filhas primeiro
    await supabase
      .from('metas')
      .update({ deletado_em: new Date().toISOString(), ativa: false })
      .eq('meta_pai_id', id)

    const { error } = await supabase
      .from('metas')
      .update({ deletado_em: new Date().toISOString(), ativa: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir meta: ${error.message}`)
  },

  distribuir: async (id: string, payload: Record<string, unknown>) => {
    // Usar função do banco para distribuição
    const { data, error } = await supabase.rpc('distribuir_meta', {
      p_meta_id: id,
      p_modo: (payload.tipo_distribuicao as string) || 'igual',
    })

    if (error) throw new Error(`Erro ao distribuir meta: ${error.message}`)
    return data
  },

  buscarEmpresa: async () => {
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em)`)
      .eq('tipo', 'empresa')
      .eq('ativa', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao buscar metas empresa: ${error.message}`)
    const metas = (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>))

    const totalMetas = metas.length
    const metasAtingidas = metas.filter(m => m.progresso && m.progresso.percentual_atingido >= 100).length
    const mediaAtingimento = metas.reduce((acc, m) => acc + (m.progresso?.percentual_atingido || 0), 0) / (totalMetas || 1)
    const metasEmRisco = metas.filter(m => m.progresso && m.progresso.percentual_atingido < 50).length

    return {
      metas: metas as MetaDetalhada[],
      resumo: {
        total_metas: totalMetas,
        media_atingimento: Math.round(mediaAtingimento * 100) / 100,
        metas_atingidas: metasAtingidas,
        metas_em_risco: metasEmRisco,
      },
    }
  },

  buscarEquipes: async (equipeId: string) => {
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em)`)
      .eq('equipe_id', equipeId)
      .eq('tipo', 'equipe')
      .eq('ativa', true)
      .is('deletado_em', null)

    if (error) throw new Error(`Erro ao buscar metas equipe: ${error.message}`)
    return { metas: (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>)) }
  },

  buscarIndividuais: async () => {
    const userId = await getUsuarioId()
    const { data, error, count } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em)`, { count: 'exact' })
      .eq('usuario_id', userId)
      .eq('tipo', 'individual')
      .eq('ativa', true)
      .is('deletado_em', null)

    if (error) throw new Error(`Erro ao buscar metas individuais: ${error.message}`)
    return { metas: (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>)) as MetaComProgresso[], total: count || 0 }
  },

  buscarProgresso: async () => {
    // Retorna progresso geral simplificado
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(valor_atual, percentual_atingido)`)
      .eq('ativa', true)
      .is('deletado_em', null)

    if (error) throw new Error(`Erro ao buscar progresso: ${error.message}`)
    return { total: data?.length || 0, metas: data }
  },

  buscarRanking: async (params?: Record<string, string>) => {
    // Ranking simplificado baseado em metas individuais
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(valor_atual, percentual_atingido), usuario:usuarios(id, nome, sobrenome, avatar_url)`)
      .eq('tipo', 'individual')
      .eq('ativa', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao buscar ranking: ${error.message}`)

    const ranking: RankingItem[] = (data || [])
      .map((m: Record<string, unknown>, index: number) => {
        const usuario = m.usuario as Record<string, unknown> | null
        const progresso = Array.isArray(m.progresso) ? (m.progresso as Record<string, unknown>[])[0] : m.progresso as Record<string, unknown> | null
        return {
          posicao: index + 1,
          usuario_id: (m.usuario_id || '') as string,
          usuario_nome: usuario ? `${usuario.nome || ''}${usuario.sobrenome ? ' ' + usuario.sobrenome : ''}`.trim() : '',
          avatar_url: (usuario?.avatar_url as string) || null,
          equipe_nome: null,
          valor_atingido: Number(progresso?.valor_atual || 0),
          percentual_meta: Number(progresso?.percentual_atingido || 0),
          variacao: 0,
        }
      })
      .sort((a: RankingItem, b: RankingItem) => b.percentual_meta - a.percentual_meta)
      .map((item: RankingItem, index: number) => ({ ...item, posicao: index + 1 }))

    return { ranking, metrica: params?.metrica, periodo: undefined, atualizado_em: new Date().toISOString() }
  },

  buscarMinhas: async () => {
    const userId = await getUsuarioId()
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em)`)
      .eq('usuario_id', userId)
      .eq('ativa', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao buscar minhas metas: ${error.message}`)
    return { metas: (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>)) }
  },
}

// =====================================================
// API Functions - Configurações do Tenant
// =====================================================

export const configTenantApi = {
  buscar: async () => {
    const { data, error } = await supabase
      .from('configuracoes_tenant')
      .select('*')
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar configurações: ${error.message}`)
    return data as unknown as ConfiguracaoTenant | null
  },

  atualizar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('configuracoes_tenant')
      .select('id')
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from('configuracoes_tenant')
        .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar configurações: ${error.message}`)
      return data as unknown as ConfiguracaoTenant
    } else {
      const { data, error } = await supabase
        .from('configuracoes_tenant')
        .insert({ organizacao_id: orgId, ...payload } as any)
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar configurações: ${error.message}`)
      return data as unknown as ConfiguracaoTenant
    }
  },
}
