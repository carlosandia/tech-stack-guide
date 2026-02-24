/**
 * AIDEV-NOTE: Service layer para o módulo de Configurações
 * Usa Supabase client direto (respeita RLS)
 * Conforme PRD-05 - Configurações do Tenant
 *
 * RLS filtra automaticamente pelo tenant do usuario logado
 * Para INSERTs, organizacao_id é obtido via helper getOrganizacaoId()
 */

import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import api from '@/lib/api'
import { getOrganizacaoId, getUsuarioId } from '@/shared/services/auth-context'

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
export type ModoTarefa = 'comum' | 'cadencia'
export interface TarefaTemplate {
  id: string
  organizacao_id: string
  titulo: string
  descricao?: string | null
  tipo: TipoTarefa
  canal?: string | null
  prioridade: PrioridadeTarefa
  dias_prazo: number
  modo: ModoTarefa
  assunto_email?: string | null
  corpo_mensagem?: string | null
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
export type PlataformaIntegracao = 'whatsapp' | 'instagram' | 'meta_ads' | 'google' | 'email' | 'api4com'
export type TipoConexaoEmail = 'gmail_oauth' | 'smtp_manual'

export interface Integracao {
  id: string
  organizacao_id: string
  plataforma: PlataformaIntegracao
  status: string
  conta_externa_nome?: string | null
  conta_externa_email?: string | null
  waha_phone?: string | null
  waha_session_name?: string | null
  waha_session_id?: string | null
  ultimo_sync?: string | null
  ultimo_erro?: string | null
  conectado_em?: string | null
  // Email específicos
  email?: string | null
  tipo_email?: TipoConexaoEmail | null
  nome_remetente?: string | null
  // Google específicos
  google_user_email?: string | null
  google_user_name?: string | null
  calendar_name?: string | null
  calendar_id?: string | null
  // Instagram específicos
  instagram_username?: string | null
  instagram_name?: string | null
  profile_picture_url?: string | null
  token_expires_at?: string | null
  // Meta específicos
  meta_user_name?: string | null
  meta_user_email?: string | null
  meta_page_name?: string | null
  meta_business_name?: string | null
}

export interface SmtpDetectResult {
  provedor: string
  host: string
  port: number
  tls: boolean
}

export interface SmtpTestarPayload {
  email: string
  senha: string
  host?: string
  port?: number
  tls?: boolean
}

export interface WhatsAppQrCodeResult {
  qr_code?: string
  status: string
  expires_in?: number
}

// Lead Ads
export interface LeadAdForm {
  id: string
  form_id: string
  form_name: string
  page_id?: string
  page_name?: string
  pipeline_id?: string
  pipeline_nome?: string
  etapa_id?: string
  etapa_nome?: string
  mapeamento_campos: Array<{ form_field: string; crm_field: string }>
  leads_recebidos?: number
  ultimo_lead_em?: string | null
  ativo: boolean
}

// CAPI
export interface CapiConfig {
  pixel_id: string
  eventos_habilitados: Record<string, boolean>
  config_eventos?: Record<string, any>
  ativo?: boolean
  ultimo_teste?: string | null
  ultimo_teste_sucesso?: boolean
  total_eventos_enviados?: number
  total_eventos_sucesso?: number
}

// Custom Audiences
export interface CustomAudience {
  id: string
  audience_id?: string
  audience_name: string
  ad_account_id: string
  evento_gatilho?: string | null
  tipo_sincronizacao: string
  total_usuarios?: number
  ultimo_sync?: string | null
  ativo: boolean
}

export interface WhatsAppStatusResult {
  status: string
  phone?: string
  phone_name?: string
  session_id?: string
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
  secret_key?: string | null
  ativo: boolean
  criado_em: string
  total_requests?: number
  ultimo_request_em?: string | null
}

export interface WebhookSaida {
  id: string
  organizacao_id: string
  nome: string
  descricao?: string | null
  url: string
  eventos: string[]
  auth_tipo: string
  auth_header?: string | null
  auth_valor?: string | null
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
  ativa: boolean // mapped from DB column 'ativo'
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
  listarTodos: async () => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('campos_customizados')
      .select('id, nome, entidade')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('entidade')
      .order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar campos: ${error.message}`)
    return (data || []) as Array<{ id: string; nome: string; entidade: Entidade }>
  },

  listar: async (entidade: Entidade) => {
    const orgId = await getOrganizacaoId()
    const { data, error, count } = await supabase
      .from('campos_customizados')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .eq('entidade', entidade)
      .is('deletado_em', null)
      .order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar campos: ${error.message}`)
    return { campos: (data || []) as unknown as CampoCustomizado[], total: count || 0 }
  },

  buscar: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('campos_customizados')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', orgId)
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
    let slug = payload.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

    // Verificar duplicidade de slug e adicionar sufixo se necessário
    let slugFinal = slug
    let tentativa = 0
    // AIDEV-NOTE: Limite de 10 tentativas para evitar loop infinito
    while (tentativa < 10) {
      const { data: existente } = await supabase
        .from('campos_customizados')
        .select('id')
        .eq('organizacao_id', orgId)
        .eq('entidade', payload.entidade)
        .eq('slug', slugFinal)
        .is('deletado_em', null)
        .maybeSingle()

      if (!existente) break
      tentativa++
      slugFinal = `${slug}_${tentativa}`
    }
    slug = slugFinal

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

  // AIDEV-NOTE: Seg — whitelist Zod evita field injection; orgId no WHERE previne IDOR
  atualizar: async (id: string, payload: AtualizarCampoPayload) => {
    const orgId = await getOrganizacaoId()
    const AtualizarCampoSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      descricao: z.string().optional(),
      obrigatorio: z.boolean().optional(),
      valor_padrao: z.unknown().optional(),
      placeholder: z.string().optional(),
      validacoes: z.record(z.unknown()).optional(),
      opcoes: z.array(z.unknown()).optional(),
      ativo: z.boolean().optional(),
    })
    const validated = AtualizarCampoSchema.parse(payload)
    const { data, error } = await supabase
      .from('campos_customizados')
      .update({
        ...validated,
        validacoes: validated.validacoes ? (validated.validacoes as any) : undefined,
        opcoes: validated.opcoes ? (validated.opcoes as any) : undefined,
        atualizado_em: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar campo: ${error.message}`)
    return data as unknown as CampoCustomizado
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('campos_customizados')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir campo: ${error.message}`)
  },

  // AIDEV-NOTE: Seg — orgId em cada update do batch previne IDOR na reordenação
  reordenar: async (entidade: Entidade, ordem: Array<{ id: string; ordem: number }>) => {
    const orgId = await getOrganizacaoId()
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('campos_customizados')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('entidade', entidade)
        .eq('organizacao_id', orgId)
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
    const orgId = await getOrganizacaoId()
    const page = parseInt(params?.page || '1')
    const limit = Math.min(parseInt(params?.limit || '20'), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('produtos')
      .select('*, categoria:categorias_produtos(id, nome)', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    if (params?.categoria_id) query = query.eq('categoria_id', params.categoria_id)
    if (params?.busca) {
      const busca = params.busca.substring(0, 50)
      query = query.or(`nome.ilike.%${busca}%`)
    }
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

  // AIDEV-NOTE: Seg — Zod whitelist evita que payload sobrescreva organizacao_id via spread
  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const CriarProdutoSchema = z.object({
      nome: z.string().min(1).max(255),
      descricao: z.string().optional(),
      preco: z.number().nonnegative().optional(),
      preco_recorrente: z.number().nonnegative().optional(),
      recorrente: z.boolean().optional(),
      ativo: z.boolean().optional(),
      categoria_id: z.string().uuid().optional(),
      imagem_url: z.string().url().optional(),
    })
    const validated = CriarProdutoSchema.parse(payload)
    const { data, error } = await supabase
      .from('produtos')
      .insert({ ...validated, organizacao_id: orgId, criado_por: userId } as any)
      .select('*, categoria:categorias_produtos(id, nome)')
      .single()

    if (error) throw new Error(`Erro ao criar produto: ${error.message}`)
    return data as unknown as Produto
  },

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE previnem field injection e IDOR
  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const AtualizarProdutoSchema = z.object({
      nome: z.string().min(1).max(255).optional(),
      descricao: z.string().optional(),
      preco: z.number().nonnegative().optional(),
      preco_recorrente: z.number().nonnegative().optional(),
      recorrente: z.boolean().optional(),
      ativo: z.boolean().optional(),
      categoria_id: z.string().uuid().nullable().optional(),
      imagem_url: z.string().url().nullable().optional(),
    })
    const validated = AtualizarProdutoSchema.parse(payload)
    const { data, error } = await supabase
      .from('produtos')
      .update({ ...validated, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select('*, categoria:categorias_produtos(id, nome)')
      .single()

    if (error) throw new Error(`Erro ao atualizar produto: ${error.message}`)
    return data as unknown as Produto
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('produtos')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir produto: ${error.message}`)
  },

  listarCategorias: async () => {
    const orgId = await getOrganizacaoId()
    const { data, error, count } = await supabase
      .from('categorias_produtos')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('nome', { ascending: true })

    if (error) throw new Error(`Erro ao listar categorias: ${error.message}`)
    return { categorias: (data || []) as unknown as Categoria[], total: count || 0 }
  },

  // AIDEV-NOTE: Seg — Zod whitelist evita que payload sobrescreva organizacao_id
  criarCategoria: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const CriarCategoriaSchema = z.object({
      nome: z.string().min(1).max(100),
      descricao: z.string().optional(),
      ativo: z.boolean().optional(),
    })
    const validated = CriarCategoriaSchema.parse(payload)
    const { data, error } = await supabase
      .from('categorias_produtos')
      .insert({ ...validated, organizacao_id: orgId, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar categoria: ${error.message}`)
    return data as unknown as Categoria
  },

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE previnem field injection e IDOR
  atualizarCategoria: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const AtualizarCategoriaSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      descricao: z.string().optional(),
      ativo: z.boolean().optional(),
    })
    const validated = AtualizarCategoriaSchema.parse(payload)
    const { data, error } = await supabase
      .from('categorias_produtos')
      .update({ ...validated, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar categoria: ${error.message}`)
    return data as unknown as Categoria
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluirCategoria: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('categorias_produtos')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir categoria: ${error.message}`)
  },
}

// =====================================================
// API Functions - Motivos
// =====================================================

export const motivosApi = {
  listar: async (tipo?: TipoMotivo) => {
    const orgId = await getOrganizacaoId()
    let query = supabase
      .from('motivos_resultado')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    if (tipo) query = query.eq('tipo', tipo)

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar motivos: ${error.message}`)
    return { motivos: (data || []) as unknown as MotivoResultado[], total: count || 0 }
  },

  // AIDEV-NOTE: Seg — Zod whitelist evita que payload sobrescreva organizacao_id via spread
  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const CriarMotivoSchema = z.object({
      nome: z.string().min(1).max(200),
      descricao: z.string().optional(),
      tipo: z.enum(['ganho', 'perda']),
      ativo: z.boolean().optional(),
      cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    const validated = CriarMotivoSchema.parse(payload)

    // Buscar próxima ordem
    const { data: ultimo } = await supabase
      .from('motivos_resultado')
      .select('ordem')
      .eq('tipo', validated.tipo)
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultimo ? (ultimo.ordem ?? 0) + 1 : 0

    const { data, error } = await supabase
      .from('motivos_resultado')
      .insert({
        ...validated,
        organizacao_id: orgId,
        ordem: novaOrdem,
        padrao: false,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar motivo: ${error.message}`)
    return data as unknown as MotivoResultado
  },

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE previnem field injection e IDOR
  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const AtualizarMotivoSchema = z.object({
      nome: z.string().min(1).max(200).optional(),
      descricao: z.string().optional(),
      ativo: z.boolean().optional(),
      cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    const validated = AtualizarMotivoSchema.parse(payload)
    const { data, error } = await supabase
      .from('motivos_resultado')
      .update({ ...validated, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar motivo: ${error.message}`)
    return data as unknown as MotivoResultado
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('motivos_resultado')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir motivo: ${error.message}`)
  },

  // AIDEV-NOTE: Seg — orgId em cada update do batch previne IDOR na reordenação
  reordenar: async (tipo: TipoMotivo, ordem: Array<{ id: string; ordem: number }>) => {
    const orgId = await getOrganizacaoId()
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('motivos_resultado')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('tipo', tipo)
        .eq('organizacao_id', orgId)
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
    const orgId = await getOrganizacaoId()
    let query = supabase
      .from('tarefas_templates')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.ativo) query = query.eq('ativo', params.ativo === 'true')

    const { data, error, count } = await query.order('titulo', { ascending: true })

    if (error) throw new Error(`Erro ao listar templates: ${error.message}`)
    return { templates: (data || []) as unknown as TarefaTemplate[], total: count || 0 }
  },

  // AIDEV-NOTE: Seg — Zod whitelist evita que payload sobrescreva organizacao_id via spread
  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const CriarTarefaTemplateSchema = z.object({
      titulo: z.string().min(1).max(255),
      descricao: z.string().optional(),
      tipo: z.enum(['ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro']),
      canal: z.string().optional(),
      prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
      dias_prazo: z.number().int().nonnegative().optional(),
      modo: z.enum(['comum', 'cadencia']).optional(),
      assunto_email: z.string().optional(),
      corpo_mensagem: z.string().optional(),
      ativo: z.boolean().optional(),
    })
    const validated = CriarTarefaTemplateSchema.parse(payload)
    const { data, error } = await supabase
      .from('tarefas_templates')
      .insert({ ...validated, organizacao_id: orgId, criado_por: userId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar template: ${error.message}`)
    return data as unknown as TarefaTemplate
  },

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE previnem field injection e IDOR
  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const AtualizarTarefaTemplateSchema = z.object({
      titulo: z.string().min(1).max(255).optional(),
      descricao: z.string().optional(),
      tipo: z.enum(['ligacao', 'email', 'reuniao', 'whatsapp', 'visita', 'outro']).optional(),
      canal: z.string().optional(),
      prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
      dias_prazo: z.number().int().nonnegative().optional(),
      modo: z.enum(['comum', 'cadencia']).optional(),
      assunto_email: z.string().optional(),
      corpo_mensagem: z.string().optional(),
      ativo: z.boolean().optional(),
    })
    const validated = AtualizarTarefaTemplateSchema.parse(payload)
    const { data, error } = await supabase
      .from('tarefas_templates')
      .update({ ...validated, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar template: ${error.message}`)
    return data as unknown as TarefaTemplate
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('tarefas_templates')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir template: ${error.message}`)
  },
}

// =====================================================
// API Functions - Etapas Templates
// =====================================================

export const etapasTemplatesApi = {
  listar: async (params?: { tipo?: string; ativo?: string }) => {
    const orgId = await getOrganizacaoId()
    let query = supabase
      .from('etapas_templates')
      .select(
        `*, tarefas:etapas_tarefas(id, tarefa_template_id, criar_automaticamente, ordem, tarefa:tarefas_templates(id, titulo, tipo, descricao))`,
        { count: 'exact' }
      )
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.ativo) query = query.eq('ativo', params.ativo === 'true')

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar etapas: ${error.message}`)
    return { templates: (data || []) as unknown as EtapaTemplate[], total: count || 0 }
  },

  // AIDEV-NOTE: Seg — Zod whitelist evita que etapaData sobrescreva organizacao_id via spread
  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const { tarefas_ids, ...etapaRaw } = payload as { tarefas_ids?: string[] } & Record<string, unknown>
    const CriarEtapaSchema = z.object({
      nome: z.string().min(1).max(100),
      descricao: z.string().optional(),
      tipo: z.enum(['entrada', 'normal', 'ganho', 'perda']),
      cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      probabilidade: z.number().int().min(0).max(100).optional(),
      ativo: z.boolean().optional(),
    })
    const etapaData = CriarEtapaSchema.parse(etapaRaw)

    // Buscar próxima ordem
    const { data: ultima } = await supabase
      .from('etapas_templates')
      .select('ordem')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultima ? (ultima.ordem ?? 0) + 1 : 0

    const { data: etapa, error } = await supabase
      .from('etapas_templates')
      .insert({
        ...etapaData,
        organizacao_id: orgId,
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

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE; cascade delete em etapas_tarefas também protegido por orgId
  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const { tarefas_ids, ...etapaRaw } = payload as { tarefas_ids?: string[] } & Record<string, unknown>
    const AtualizarEtapaSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      descricao: z.string().optional(),
      tipo: z.enum(['entrada', 'normal', 'ganho', 'perda']).optional(),
      cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      probabilidade: z.number().int().min(0).max(100).optional(),
      ativo: z.boolean().optional(),
    })
    const etapaData = AtualizarEtapaSchema.parse(etapaRaw)

    const { data, error } = await supabase
      .from('etapas_templates')
      .update({ ...etapaData, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar etapa: ${error.message}`)

    // Se tarefas_ids foi passado, recriar vínculos (apenas para etapas do tenant)
    if (tarefas_ids !== undefined) {
      await supabase.from('etapas_tarefas').delete()
        .eq('etapa_template_id', id)
        .eq('organizacao_id', orgId)

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

  // AIDEV-NOTE: Seg — cascade delete protegido por orgId em ambas as tabelas
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    // Remover vínculos de tarefas primeiro (filtrado por orgId)
    await supabase.from('etapas_tarefas').delete()
      .eq('etapa_template_id', id)
      .eq('organizacao_id', orgId)

    const { error } = await supabase
      .from('etapas_templates')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir etapa: ${error.message}`)
  },

  // AIDEV-NOTE: Seg — orgId em cada update do batch previne IDOR na reordenação
  reordenar: async (ordem: Array<{ id: string; ordem: number }>) => {
    const orgId = await getOrganizacaoId()
    const updates = ordem.map(({ id, ordem: novaOrdem }) =>
      supabase
        .from('etapas_templates')
        .update({ ordem: novaOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('organizacao_id', orgId)
    )
    const results = await Promise.all(updates)
    if (results.some(r => r.error)) throw new Error('Erro ao reordenar etapas')
  },

  // AIDEV-NOTE: Seg — valida que etapaId pertence ao tenant antes de vincular
  vincularTarefa: async (etapaId: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const { data: etapa } = await supabase
      .from('etapas_templates')
      .select('id')
      .eq('id', etapaId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!etapa) throw new Error('Etapa não encontrada')

    const VincularTarefaSchema = z.object({
      tarefa_template_id: z.string().uuid(),
      criar_automaticamente: z.boolean().optional(),
      ordem: z.number().int().nonnegative().optional(),
    })
    const validated = VincularTarefaSchema.parse(payload)
    const { data, error } = await supabase
      .from('etapas_tarefas')
      .insert({ ...validated, organizacao_id: orgId, etapa_template_id: etapaId } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao vincular tarefa: ${error.message}`)
    return data
  },

  // AIDEV-NOTE: Seg — valida que etapaId pertence ao tenant antes de desvincular
  desvincularTarefa: async (etapaId: string, tarefaId: string) => {
    const orgId = await getOrganizacaoId()
    const { data: etapa } = await supabase
      .from('etapas_templates')
      .select('id')
      .eq('id', etapaId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!etapa) throw new Error('Etapa não encontrada')

    const { error } = await supabase
      .from('etapas_tarefas')
      .delete()
      .eq('etapa_template_id', etapaId)
      .eq('tarefa_template_id', tarefaId)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao desvincular tarefa: ${error.message}`)
  },
}

// =====================================================
// API Functions - Regras de Qualificação
// =====================================================

export const regrasApi = {
  // AIDEV-NOTE: Seg — CRÍTICO: orgId é obrigatório aqui, sem ele retorna regras de todos os tenants
  listar: async (params?: { ativa?: string }) => {
    const orgId = await getOrganizacaoId()
    let query = supabase
      .from('regras_qualificacao')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)

    if (params?.ativa) query = query.eq('ativa', params.ativa === 'true')

    const { data, error, count } = await query.order('ordem', { ascending: true })

    if (error) throw new Error(`Erro ao listar regras: ${error.message}`)
    return { regras: (data || []) as unknown as RegraQualificacao[], total: count || 0 }
  },

  // AIDEV-NOTE: Seg — Zod whitelist evita que payload sobrescreva organizacao_id via spread
  criar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()
    const CriarRegraSchema = z.object({
      nome: z.string().min(1).max(200),
      descricao: z.string().optional(),
      campo_id: z.string().uuid().optional(),
      operador: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'maior_que', 'menor_que', 'maior_igual', 'menor_igual', 'vazio', 'nao_vazio']),
      valor: z.string().optional(),
      valores: z.array(z.string()).optional(),
      ativo: z.boolean().optional(),
    })
    const validated = CriarRegraSchema.parse(payload)

    // Buscar próxima ordem
    const { data: ultima } = await supabase
      .from('regras_qualificacao')
      .select('ordem')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const novaOrdem = ultima ? (ultima.ordem ?? 0) + 1 : 1

    const { data, error } = await supabase
      .from('regras_qualificacao')
      .insert({
        ...validated,
        organizacao_id: orgId,
        ordem: novaOrdem,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar regra: ${error.message}`)
    return data as unknown as RegraQualificacao
  },

  // AIDEV-NOTE: Seg — Zod whitelist + orgId no WHERE previnem field injection e IDOR
  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const AtualizarRegraSchema = z.object({
      nome: z.string().min(1).max(200).optional(),
      descricao: z.string().optional(),
      campo_id: z.string().uuid().nullable().optional(),
      operador: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'maior_que', 'menor_que', 'maior_igual', 'menor_igual', 'vazio', 'nao_vazio']).optional(),
      valor: z.string().nullable().optional(),
      valores: z.array(z.string()).optional(),
      ativo: z.boolean().optional(),
    })
    const validated = AtualizarRegraSchema.parse(payload)
    const { data, error } = await supabase
      .from('regras_qualificacao')
      .update({ ...validated, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar regra: ${error.message}`)
    return data as unknown as RegraQualificacao
  },

  // AIDEV-NOTE: Seg — orgId no WHERE previne IDOR (soft delete)
  excluir: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('regras_qualificacao')
      .update({ deletado_em: new Date().toISOString(), ativa: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir regra: ${error.message}`)
  },

  // AIDEV-NOTE: Seg — orgId em cada update do batch previne IDOR na reordenação
  reordenar: async (prioridades: Array<{ id: string; ordem: number }>) => {
    const orgId = await getOrganizacaoId()
    const updates = prioridades.map(({ id, ordem }) =>
      supabase
        .from('regras_qualificacao')
        .update({ ordem, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .eq('organizacao_id', orgId)
    )
    const results = await Promise.all(updates)
    if (results.some(r => r.error)) throw new Error('Erro ao reordenar regras')
  },
}

// =====================================================
// API Functions - Configuração de Cards
// =====================================================

export const configCardApi = {
  // AIDEV-NOTE: Seg — orgId no WHERE como defense-in-depth além do RLS
  buscar: async (funil_id?: string) => {
    const orgId = await getOrganizacaoId()
    let query = supabase.from('configuracoes_card').select('*').eq('organizacao_id', orgId)
    if (funil_id) query = query.eq('funil_id', funil_id)

    const { data, error } = await query.maybeSingle()

    if (error) throw new Error(`Erro ao buscar config card: ${error.message}`)
    return data as unknown as ConfiguracaoCard | null
  },

  // AIDEV-NOTE: Upsert otimizado — 1 query ao invés de 2 (SELECT+UPDATE/INSERT)
  // AIDEV-NOTE: Seg — Zod whitelist evita field injection via spread no upsert
  atualizar: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const ConfigCardSchema = z.object({
      funil_id: z.string().uuid().nullable().optional(),
      campos_visiveis: z.array(z.string()).optional(),
      campos_customizados_visiveis: z.array(z.string()).optional(),
    })
    const validated = ConfigCardSchema.parse(payload)

    const { data, error } = await supabase
      .from('configuracoes_card')
      .upsert(
        { ...validated, organizacao_id: orgId, atualizado_em: new Date().toISOString() } as any,
        { onConflict: 'organizacao_id' }
      )
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar config card: ${error.message}`)
    return data as unknown as ConfiguracaoCard
  },
}

// =====================================================
// API Functions - Integracoes
// =====================================================

export const integracoesApi = {
  // AIDEV-NOTE: Paralelizado — 6 queries simultâneas ao invés de sequenciais (6x RTT → 1x RTT)
  listar: async () => {
    const integracoes: Integracao[] = []
    const userId = await getUsuarioId()

    const [whatsappResult, instagramResult, googleResult, emailResult, metaResult, api4comResult] = await Promise.all([
      supabase
        .from('sessoes_whatsapp')
        .select('id, organizacao_id, usuario_id, status, phone_number, phone_name, session_name, conectado_em, atualizado_em')
        .eq('usuario_id', userId)
        .is('deletado_em', null),
      supabase
        .from('conexoes_instagram')
        .select('id, organizacao_id, status, instagram_username, instagram_name, profile_picture_url, token_expires_at, conectado_em, ultimo_sync, ultimo_erro')
        .is('deletado_em', null),
      supabase
        .from('conexoes_google')
        .select('id, organizacao_id, status, google_user_email, google_user_name, calendar_name, calendar_id, conectado_em, ultimo_sync, ultimo_erro')
        .is('deletado_em', null),
      supabase
        .from('conexoes_email')
        .select('id, organizacao_id, status, email, tipo, nome_remetente, conectado_em, ultimo_envio, ultimo_erro')
        .is('deletado_em', null),
      supabase
        .from('conexoes_meta')
        .select('id, organizacao_id, status, meta_user_name, meta_user_email, meta_business_name, ultimo_sync, ultimo_erro')
        .is('deletado_em', null),
      supabase
        .from('conexoes_api4com')
        .select('id, organizacao_id, status, api_url, conectado_em, ultimo_erro')
        .is('deletado_em', null),
    ])

    // WhatsApp
    if (whatsappResult.data) {
      whatsappResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'whatsapp',
          status: ['connected', 'conectado', 'ativo', 'active'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          waha_phone: row.phone_number as string | null,
          waha_session_name: row.phone_name as string | null,
          waha_session_id: row.id as string,
          conectado_em: row.conectado_em as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
          ultimo_sync: row.atualizado_em as string | null,
        })
      })
    }

    // Instagram
    if (instagramResult.data) {
      instagramResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'instagram',
          status: ['connected', 'conectado', 'ativo', 'active'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          instagram_username: row.instagram_username as string | null,
          instagram_name: row.instagram_name as string | null,
          profile_picture_url: row.profile_picture_url as string | null,
          token_expires_at: row.token_expires_at as string | null,
          conectado_em: row.conectado_em as string | null,
          ultimo_sync: row.ultimo_sync as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
        })
      })
    }

    // Google Calendar
    if (googleResult.data) {
      googleResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'google',
          status: ['connected', 'conectado', 'ativo', 'active'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          google_user_email: row.google_user_email as string | null,
          google_user_name: row.google_user_name as string | null,
          calendar_name: row.calendar_name as string | null,
          calendar_id: row.calendar_id as string | null,
          conectado_em: row.conectado_em as string | null,
          ultimo_sync: row.ultimo_sync as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
        })
      })
    }

    // Email
    if (emailResult.data) {
      emailResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'email',
          status: ['connected', 'ativo', 'active', 'conectado'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          email: row.email as string | null,
          tipo_email: row.tipo as TipoConexaoEmail | null,
          nome_remetente: row.nome_remetente as string | null,
          conectado_em: row.conectado_em as string | null,
          ultimo_sync: row.ultimo_envio as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
        })
      })
    }

    // Meta Ads
    if (metaResult.data) {
      // Buscar páginas conectadas para cada conexão Meta
      const metaIds = metaResult.data.map((r: Record<string, unknown>) => r.id as string)
      let paginasMap: Record<string, string> = {}
      if (metaIds.length > 0) {
        const { data: paginas } = await supabase
          .from('paginas_meta')
          .select('conexao_id, page_name')
          .in('conexao_id', metaIds)
          .eq('ativo', true)
        if (paginas) {
          paginas.forEach((p: Record<string, unknown>) => {
            paginasMap[p.conexao_id as string] = p.page_name as string
          })
        }
      }

      metaResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'meta_ads',
          status: ['connected', 'conectado', 'ativo', 'active'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          meta_user_name: row.meta_user_name as string | null,
          meta_user_email: row.meta_user_email as string | null,
          meta_page_name: paginasMap[row.id as string] || null,
          meta_business_name: row.meta_business_name as string | null,
          ultimo_sync: row.ultimo_sync as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
        })
      })
    }

    // API4COM
    if (api4comResult.data) {
      api4comResult.data.forEach((row: Record<string, unknown>) => {
        integracoes.push({
          id: row.id as string,
          organizacao_id: row.organizacao_id as string,
          plataforma: 'api4com',
          status: ['connected', 'ativo', 'conectado'].includes(row.status as string) ? 'conectado' : (row.status as string) || 'desconectado',
          conectado_em: row.conectado_em as string | null,
          ultimo_erro: row.ultimo_erro as string | null,
          conta_externa_nome: row.api_url as string | null,
        })
      })
    }

    return { integracoes, total: integracoes.length }
  },

  obterAuthUrl: async (plataforma: PlataformaIntegracao, redirect_uri: string): Promise<{ url: string; state?: string }> => {
    // AIDEV-NOTE: Google usa Edge Function diretamente para funcionar em producao
    if (plataforma === 'google') {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { action: 'auth-url', tipo: 'calendar', redirect_uri },
      })
      if (error) throw new Error(error.message || 'Erro ao obter URL de autenticação Google')
      return data
    }
    // AIDEV-NOTE: Meta Ads usa Edge Function para funcionar em producao (sem backend localhost)
    if (plataforma === 'meta_ads') {
      const { data, error } = await supabase.functions.invoke('meta-auth', {
        body: { action: 'auth-url', redirect_uri },
      })
      if (error) throw new Error(error.message || 'Erro ao obter URL de autenticação Meta')
      return data
    }
    const { data } = await api.get(`/v1/conexoes/${plataforma}/auth-url`, {
      params: { redirect_uri },
    })
    return data
  },

  processarCallback: async (plataforma: PlataformaIntegracao | 'meta_ads', payload: { code: string; state: string; redirect_uri: string }) => {
    // AIDEV-NOTE: Meta Ads usa Edge Function para trocar code por token
    if (plataforma === 'meta_ads') {
      const { data, error } = await supabase.functions.invoke('meta-callback', {
        body: payload,
      })
      if (error) throw new Error(error.message || 'Erro ao processar callback Meta')
      return data
    }
    const { data } = await api.post(`/v1/conexoes/${plataforma}/callback`, payload)
    return data
  },

  desconectar: async (plataforma: PlataformaIntegracao, _id?: string) => {
    const routePlataforma = plataforma === 'meta_ads' ? 'meta' : plataforma
    if (routePlataforma === 'whatsapp') {
      await supabase.functions.invoke('waha-proxy', {
        body: { action: 'desconectar' },
      })
    } else if (routePlataforma === 'api4com') {
      // Soft delete na conexao api4com
      if (_id) {
        await supabase
          .from('conexoes_api4com')
          .update({ deletado_em: new Date().toISOString(), status: 'desconectado' })
          .eq('id', _id)
      }
    } else if (routePlataforma === 'google') {
      // AIDEV-NOTE: Google usa Edge Function para funcionar em producao
      const { error } = await supabase.functions.invoke('google-auth', {
        body: { action: 'disconnect' },
      })
      if (error) throw new Error(error.message || 'Erro ao desconectar Google')
    } else if (routePlataforma === 'email') {
      if (_id) {
        const { error } = await supabase
          .from('conexoes_email')
          .update({ deletado_em: new Date().toISOString(), status: 'desconectado' })
          .eq('id', _id)
        if (error) throw new Error(error.message || 'Erro ao desconectar email')
      }
    } else if (routePlataforma === 'instagram') {
      if (_id) {
        const { error } = await supabase
          .from('conexoes_instagram')
          .update({ deletado_em: new Date().toISOString(), status: 'desconectado' })
          .eq('id', _id)
        if (error) throw new Error(error.message || 'Erro ao desconectar instagram')
      }
    } else if (routePlataforma === 'meta') {
      if (_id) {
        const { error } = await supabase
          .from('conexoes_meta')
          .update({ deletado_em: new Date().toISOString(), status: 'desconectado' })
          .eq('id', _id)
        if (error) throw new Error(error.message || 'Erro ao desconectar meta')
      }
    } else {
      await api.delete(`/v1/conexoes/${routePlataforma}`)
    }
  },

  sincronizar: async (_id: string, plataforma?: PlataformaIntegracao) => {
    // AIDEV-NOTE: Meta Ads usa Edge Function meta-sync para sincronização real
    if (plataforma === 'meta_ads') {
      const { data, error } = await supabase.functions.invoke('meta-sync')
      if (error) throw new Error(error.message || 'Erro ao sincronizar Meta')
      if (data?.error) {
        const msg = data.error === 'token_invalido'
          ? `Token Meta expirado. Reconecte sua conta.`
          : data.message || data.error
        throw new Error(msg)
      }
      return data
    }
    // Demais plataformas - stub genérico
    return { success: true }
  },

  // WhatsApp específico - via Edge Function waha-proxy
  whatsapp: {
    iniciarSessao: async () => {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'iniciar' },
      })
      if (error) throw new Error(error.message || 'Erro ao iniciar sessão WAHA')
      return data
    },
    obterQrCode: async (): Promise<WhatsAppQrCodeResult> => {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'qr_code' },
      })
      if (error) throw new Error(error.message || 'Erro ao obter QR Code')
      return data as WhatsAppQrCodeResult
    },
    obterStatus: async (): Promise<WhatsAppStatusResult> => {
      const { data, error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'status' },
      })
      if (error) throw new Error(error.message || 'Erro ao obter status')
      return data as WhatsAppStatusResult
    },
    desconectar: async () => {
      const { error } = await supabase.functions.invoke('waha-proxy', {
        body: { action: 'desconectar' },
      })
      if (error) throw new Error(error.message || 'Erro ao desconectar')
    },
  },

  // Email específico
  email: {
    salvarSmtp: async (payload: SmtpTestarPayload) => {
      // Chama Edge Function test-smtp modo salvar via Supabase (evita CORS com localhost)
      // AIDEV-NOTE: Console.logs removidos (Auditoria M3 - dados SMTP sensíveis)
      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: { modo: 'salvar', email: payload.email, senha: payload.senha },
      })
      if (error) throw error
      if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha ao salvar conexão')
      return data
    },
    testarSmtp: async (payload: SmtpTestarPayload) => {
      // Chama Edge Function test-smtp via Supabase (evita CORS com localhost)
      // AIDEV-NOTE: Console.logs removidos (Auditoria M3 - dados SMTP sensíveis)
      const { data, error } = await supabase.functions.invoke('test-smtp', {
        body: { modo: 'direto', email: payload.email, senha: payload.senha },
      })
      if (error) throw error
      if (data && !data.sucesso) throw new Error(data.mensagem || 'Falha no teste SMTP')
      return data
    },
    detectarSmtp: async (emailAddr: string): Promise<SmtpDetectResult> => {
      // Auto-detecta provedor SMTP localmente (sem necessidade de backend)
      const domain = emailAddr.split('@')[1]?.toLowerCase()
      if (!domain) return { provedor: '', host: '', port: 587, tls: true }
      const providers: Record<string, { provedor: string; host: string; port: number }> = {
        'gmail.com': { provedor: 'Gmail', host: 'smtp.gmail.com', port: 587 },
        'googlemail.com': { provedor: 'Gmail', host: 'smtp.gmail.com', port: 587 },
        'outlook.com': { provedor: 'Outlook', host: 'smtp.office365.com', port: 587 },
        'hotmail.com': { provedor: 'Outlook', host: 'smtp.office365.com', port: 587 },
        'live.com': { provedor: 'Outlook', host: 'smtp.office365.com', port: 587 },
        'yahoo.com': { provedor: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587 },
        'yahoo.com.br': { provedor: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587 },
        'icloud.com': { provedor: 'iCloud', host: 'smtp.mail.me.com', port: 587 },
        'zoho.com': { provedor: 'Zoho', host: 'smtp.zoho.com', port: 587 },
        'uol.com.br': { provedor: 'UOL', host: 'smtps.uol.com.br', port: 587 },
        'terra.com.br': { provedor: 'Terra', host: 'smtp.terra.com.br', port: 587 },
      }
      const match = providers[domain]
      if (match) return { provedor: match.provedor, host: match.host, port: match.port, tls: true }
      return { provedor: domain, host: `smtp.${domain}`, port: 587, tls: true }
    },
    obterGmailAuthUrl: async (): Promise<{ url: string }> => {
      // AIDEV-NOTE: Gmail auth URL via Edge Function (sem backend Express)
      // Usa a mesma rota de callback OAuth que o Google Calendar
      const redirectUri = `${window.location.origin}/oauth/google/callback`
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { action: 'auth-url', tipo: 'gmail', redirect_uri: redirectUri },
      })
      if (error) throw new Error(error.message || 'Erro ao obter URL Gmail')
      return data
    },
    desconectar: async () => {
      // AIDEV-NOTE: Desconexão email via Edge Function
      const { error } = await supabase.functions.invoke('google-auth', {
        body: { action: 'disconnect' },
      })
      if (error) throw new Error(error.message || 'Erro ao desconectar email')
    },
  },
}

// =====================================================
// API Functions - Meta Ads (Lead Ads, CAPI, Audiences)
// =====================================================

export const metaAdsApi = {
  listarFormularios: async () => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('formularios_lead_ads')
      .select('id, form_id, form_name, pagina_id, funil_id, etapa_destino_id, mapeamento_campos, total_leads_recebidos, ultimo_lead_recebido, ativo, paginas_meta(page_name)')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
    if (error) throw error
    const formularios: LeadAdForm[] = (data || []).map((r: any) => ({
      id: r.id,
      form_id: r.form_id,
      form_name: r.form_name || '',
      page_id: r.pagina_id,
      page_name: r.paginas_meta?.page_name || '',
      pipeline_id: r.funil_id,
      etapa_id: r.etapa_destino_id,
      mapeamento_campos: (r.mapeamento_campos as any) || [],
      leads_recebidos: r.total_leads_recebidos || 0,
      ultimo_lead_em: r.ultimo_lead_recebido,
      ativo: r.ativo ?? true,
    }))
    return { formularios }
  },
  criarFormulario: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    // AIDEV-NOTE: page_id do Facebook é string numérica. Fazemos upsert em paginas_meta para obter UUID interno.
    const facebookPageId = payload.page_id as string
    const conexaoId = payload.conexao_id as string

    // Upsert garante que a página existe em paginas_meta (constraint unique: organizacao_id, page_id)
    const { data: paginaMeta, error: errPagina } = await supabase
      .from('paginas_meta')
      .upsert(
        {
          organizacao_id: orgId,
          conexao_id: conexaoId,
          page_id: facebookPageId,
          page_name: (payload.page_name as string) || 'Página Facebook',
        },
        { onConflict: 'organizacao_id,page_id' }
      )
      .select('id')
      .single()

    if (errPagina) throw errPagina
    const paginaUuid = paginaMeta.id
    // AIDEV-NOTE: Upsert para reativar formulários previamente removidos (soft delete)
    const { data, error } = await supabase
      .from('formularios_lead_ads')
      .upsert(
        {
          organizacao_id: orgId,
          form_id: payload.form_id as string,
          form_name: (payload.form_name as string) || null,
          pagina_id: paginaUuid,
          funil_id: (payload.pipeline_id as string) || null,
          etapa_destino_id: (payload.etapa_id as string) || null,
          mapeamento_campos: payload.mapeamento_campos as any,
          ativo: true,
          deletado_em: null,
        },
        { onConflict: 'organizacao_id,form_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },
  atualizarFormulario: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('formularios_lead_ads')
      .update({
        form_name: (payload.form_name as string) || undefined,
        funil_id: (payload.pipeline_id as string) || undefined,
        etapa_destino_id: (payload.etapa_id as string) || undefined,
        mapeamento_campos: payload.mapeamento_campos as any,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  removerFormulario: async (id: string) => {
    const { error } = await supabase
      .from('formularios_lead_ads')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },
  listarPaginas: async () => {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token || ''
    const res = await fetch(
      `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-pages?action=pages`,
      { headers: { Authorization: `Bearer ${token}`, apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Erro ao buscar páginas')
    }
    return await res.json() as { paginas: Array<{ id: string; name: string }> }
  },
  listarFormulariosPagina: async (pageId: string) => {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token || ''
    const res = await fetch(
      `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-pages?action=forms&page_id=${encodeURIComponent(pageId)}`,
      { headers: { Authorization: `Bearer ${token}`, apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Erro ao buscar formulários')
    }
    return await res.json() as { formularios: Array<{ id: string; name: string; fields?: Array<{ key: string }> }> }
  },
  // AIDEV-NOTE: Migrado de Axios (localhost:3001) para Supabase direto
  obterCapiConfig: async (): Promise<CapiConfig | null> => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('config_conversions_api')
      .select('pixel_id, eventos_habilitados, config_eventos, ativo, ultimo_teste, ultimo_teste_sucesso, total_eventos_enviados, total_eventos_sucesso')
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (error) {
      console.error('[CAPI] Erro ao obter config:', error)
      return null
    }
    return data as CapiConfig | null
  },
  salvarCapiConfig: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()
    const upsertPayload = {
      organizacao_id: orgId,
      pixel_id: payload.pixel_id as string,
      eventos_habilitados: payload.eventos_habilitados as Record<string, boolean>,
      config_eventos: (payload.config_eventos ?? {}) as Record<string, unknown>,
      ativo: true,
      access_token_encrypted: '', // placeholder — token real fica no backend/edge function
      atualizado_em: new Date().toISOString(),
    } as any
    const { data, error } = await supabase
      .from('config_conversions_api')
      .upsert(upsertPayload, { onConflict: 'organizacao_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
  testarCapi: async () => {
    // AIDEV-NOTE: Envia evento de teste real para Meta CAPI via Edge Function
    const { data, error } = await supabase.functions.invoke('test-capi-event', {
      method: 'POST',
    })
    if (error) {
      // AIDEV-NOTE: Extrair mensagem do body JSON quando SDK captura como FunctionsHttpError
      const context = (error as any)?.context
      if (context?.body) {
        try {
          const parsed = typeof context.body === 'string' ? JSON.parse(context.body) : context.body
          if (parsed?.erro) return { sucesso: false, erro: parsed.erro }
        } catch (_) { /* fallback abaixo */ }
      }
      console.error('[CAPI] Erro ao testar:', error)
      return { sucesso: false, erro: error.message }
    }
    return data as { sucesso: boolean; erro?: string; mensagem?: string; test_event_code?: string }
  },
  listarAudiences: async () => {
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .select('*')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
    if (error) throw error
    return { audiences: (data || []) as CustomAudience[] }
  },
  // AIDEV-NOTE: Cria audience no Meta via Edge Function e depois salva no banco com ID real
  criarAudience: async (payload: Record<string, unknown>) => {
    const orgId = await getOrganizacaoId()

    // 1. Criar no Meta via Edge Function
    const { data: metaResult, error: metaError } = await supabase.functions.invoke('meta-audiences', {
      body: {
        action: 'create',
        ad_account_id: payload.ad_account_id as string,
        audience_name: payload.audience_name as string,
      },
    })

    // AIDEV-NOTE: Supabase SDK pode retornar o erro no metaError (status != 2xx) ou no metaResult.error
    if (metaError) {
      // Tentar extrair mensagem do body JSON quando o SDK captura como FunctionsHttpError
      const context = (metaError as any)?.context
      if (context?.body) {
        try {
          const parsed = typeof context.body === 'string' ? JSON.parse(context.body) : context.body
          if (parsed?.error) throw new Error(parsed.error)
        } catch (e) {
          if (e instanceof Error && e.message !== metaError.message) throw e
        }
      }
      throw new Error(metaError.message || 'Erro ao criar público no Meta')
    }
    if (metaResult?.error) throw new Error(metaResult.error)
    if (!metaResult?.audience_id) throw new Error('Meta não retornou o ID do público criado')

    // 2. Salvar no banco com audience_id real do Meta
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .insert({
        organizacao_id: orgId,
        audience_id: metaResult.audience_id,
        audience_name: payload.audience_name as string,
        ad_account_id: payload.ad_account_id as string,
        tipo_sincronizacao: (payload.tipo_sincronizacao as string) || 'evento',
        evento_gatilho: (payload.evento_gatilho as string) || null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
  // AIDEV-NOTE: Remove audience do Meta via Edge Function e faz soft delete no banco
  removerAudience: async (id: string) => {
    // 1. Buscar dados do audience
    const { data: aud, error: audErr } = await supabase
      .from('custom_audiences_meta')
      .select('audience_id, ad_account_id')
      .eq('id', id)
      .single()
    if (audErr || !aud) throw new Error('Audience não encontrado')

    // 2. Se tem audience_id real (não pending_), deletar no Meta
    if (aud.audience_id && !aud.audience_id.startsWith('pending_')) {
      const { data: metaResult, error: metaError } = await supabase.functions.invoke('meta-audiences', {
        body: {
          action: 'delete',
          audience_id: aud.audience_id,
          ad_account_id: aud.ad_account_id,
        },
      })
      if (metaError) throw new Error(metaError.message || 'Erro ao remover público do Meta')
      if (metaResult?.error) throw new Error(metaResult.error)
    }

    // 3. Soft delete no banco
    const { error } = await supabase
      .from('custom_audiences_meta')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },
  atualizarAudience: async (id: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  // AIDEV-NOTE: Vincula evento gatilho a um audience existente
  vincularEventoAudience: async (id: string, evento_gatilho: string | null) => {
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .update({ evento_gatilho, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  // AIDEV-NOTE: Sincroniza audience via Edge Function sync-audience-capi
  sincronizarAudience: async (id: string) => {
    // Buscar dados do audience
    const { data: aud, error: audErr } = await supabase
      .from('custom_audiences_meta')
      .select('audience_id, ad_account_id, organizacao_id, evento_gatilho')
      .eq('id', id)
      .single()
    if (audErr || !aud) throw new Error('Audience não encontrado')

    // Buscar contatos do CRM para sincronizar (baseado no evento_gatilho)
    const orgId = aud.organizacao_id
    const { data: contatos, error: contErr } = await supabase
      .from('contatos')
      .select('email, telefone, nome')
      .eq('organizacao_id', orgId)
      .eq('tipo', 'pessoa')
      .is('deletado_em', null)
      .limit(500)
    if (contErr) throw contErr

    if (!contatos || contatos.length === 0) {
      // Apenas atualizar ultimo_sync
      await supabase.from('custom_audiences_meta').update({ ultimo_sync: new Date().toISOString() }).eq('id', id)
      return { success: true, num_received: 0 }
    }

    // Invocar sync-audience-capi
    const { data, error } = await supabase.functions.invoke('sync-audience-capi', {
      body: {
        audience_id: aud.audience_id,
        ad_account_id: aud.ad_account_id,
        organizacao_id: orgId,
        contatos: contatos.map((c: any) => ({ email: c.email, telefone: c.telefone, nome: c.nome })),
      },
    })
    if (error) throw new Error(error.message || 'Erro ao sincronizar')
    if (data?.error) throw new Error(data.error)
    return data
  },
  // AIDEV-NOTE: Busca públicos personalizados existentes na conta Meta Ads via Edge Function
  buscarAudiencesMeta: async (adAccountId: string) => {
    const { data, error } = await supabase.functions.invoke('meta-audiences', {
      body: { action: 'list', ad_account_id: adAccountId },
    })
    if (error) throw new Error(error.message || 'Erro ao buscar públicos do Meta')
    if (data?.error) throw new Error(data.error)
    return data as { audiences: Array<{ id: string; name: string; approximate_count: number }> }
  },
  // AIDEV-NOTE: Importa públicos selecionados do Meta para a tabela local
  importarAudiences: async (audiences: Array<{ id: string; name: string; approximate_count: number; ad_account_id: string }>) => {
    const orgId = await getOrganizacaoId()
    const rows = audiences.map((a) => ({
      organizacao_id: orgId,
      audience_id: a.id,
      audience_name: a.name,
      ad_account_id: a.ad_account_id,
      total_usuarios: a.approximate_count,
      tipo_sincronizacao: 'manual',
    }))
    const { data, error } = await supabase
      .from('custom_audiences_meta')
      .insert(rows)
      .select()
    if (error) throw error
    return data
  },
}

// =====================================================
// API Functions - Google Calendar
// =====================================================

export const googleCalendarApi = {
  listarCalendarios: async () => {
    const { data, error } = await supabase.functions.invoke('google-auth', {
      body: { action: 'list-calendars' },
    })
    if (error) throw new Error(error.message || 'Erro ao listar calendários')
    return data as { calendarios: Array<{ id: string; summary: string; description?: string; backgroundColor?: string }> }
  },
  selecionarCalendario: async (payload: { calendar_id: string; criar_google_meet?: boolean; sincronizar_eventos?: boolean }) => {
    const { data, error } = await supabase.functions.invoke('google-auth', {
      body: { action: 'select-calendar', ...payload },
    })
    if (error) throw new Error(error.message || 'Erro ao selecionar calendário')
    return data
  },
}

// =====================================================
// API Functions - Webhooks
// =====================================================

export const webhooksApi = {
  /**
   * Busca ou cria automaticamente o webhook de entrada da organização.
   * Padrão: 1 webhook por organização, pré-configurado.
   */
  obterOuCriarEntrada: async (): Promise<WebhookEntrada> => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Buscar existente
    const { data: existente } = await supabase
      .from('webhooks_entrada')
      .select('*')
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existente) {
      const wh = existente as unknown as WebhookEntrada
      wh.url_completa = `${env.SUPABASE_URL}/functions/v1/webhook-entrada/${wh.url_token}`
      return wh
    }

    // Criar novo automaticamente com chaves pré-geradas
    const urlToken = crypto.randomUUID().replace(/-/g, '')
    const apiKey = `whk_${crypto.randomUUID().replace(/-/g, '')}`
    const secretKey = `whs_${crypto.randomUUID().replace(/-/g, '')}`

    const { data, error } = await supabase
      .from('webhooks_entrada')
      .insert({
        organizacao_id: orgId,
        nome: 'Webhook Principal',
        descricao: 'Webhook de entrada para receber leads de plataformas externas',
        url_token: urlToken,
        api_key: apiKey,
        secret_key: secretKey,
        ativo: false,
        criado_por: userId,
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar webhook: ${error.message}`)
    const wh = data as unknown as WebhookEntrada
    wh.url_completa = `${env.SUPABASE_URL}/functions/v1/webhook-entrada/${wh.url_token}`
    return wh
  },

  listarEntrada: async () => {
    // AIDEV-NOTE: Seg — filtro organizacao_id obrigatório para isolamento multi-tenant
    const orgId = await getOrganizacaoId()
    const { data, error, count } = await supabase
      .from('webhooks_entrada')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao listar webhooks: ${error.message}`)
    const webhooks = (data || []).map((d: any) => ({
      ...d,
      url_completa: `${env.SUPABASE_URL}/functions/v1/webhook-entrada/${d.url_token}`,
    })) as unknown as WebhookEntrada[]
    return { webhooks, total: count || 0 }
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
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de atualizar (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('webhooks_entrada')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  excluirEntrada: async (id: string) => {
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de excluir (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('webhooks_entrada')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
  },

  regenerarToken: async (id: string) => {
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de regenerar token (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const novoToken = crypto.randomUUID().replace(/-/g, '')
    const { data, error } = await supabase
      .from('webhooks_entrada')
      .update({ url_token: novoToken, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao regenerar token: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  regenerarChaves: async (id: string) => {
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de regenerar chaves (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const novaApiKey = `whk_${crypto.randomUUID().replace(/-/g, '')}`
    const novaSecretKey = `whs_${crypto.randomUUID().replace(/-/g, '')}`

    const { data, error } = await supabase
      .from('webhooks_entrada')
      .update({
        api_key: novaApiKey,
        secret_key: novaSecretKey,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao regenerar chaves: ${error.message}`)
    return data as unknown as WebhookEntrada
  },

  listarSaida: async () => {
    // AIDEV-NOTE: Seg — filtro organizacao_id obrigatório para isolamento multi-tenant
    const orgId = await getOrganizacaoId()
    const { data, error, count } = await supabase
      .from('webhooks_saida')
      .select('*', { count: 'exact' })
      .eq('organizacao_id', orgId)
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
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de atualizar (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('webhooks_saida')
      .update({ ...payload, atualizado_em: new Date().toISOString() } as any)
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar webhook: ${error.message}`)
    return data as unknown as WebhookSaida
  },

  excluirSaida: async (id: string) => {
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de excluir (IDOR prevention)
    const orgId = await getOrganizacaoId()
    const { error } = await supabase
      .from('webhooks_saida')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao excluir webhook: ${error.message}`)
  },

  testarSaida: async (id: string) => {
    // AIDEV-NOTE: Seg — validar ownership de tenant antes de testar (IDOR prevention)
    const orgId = await getOrganizacaoId()
    // Buscar webhook validando tenant
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks_saida')
      .select('*')
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .single()

    if (fetchError || !webhook) throw new Error('Webhook não encontrado')

    const wh = webhook as unknown as WebhookSaida

    // AIDEV-NOTE: Seg — SSRF prevention: bloquear IPs privados/localhost
    try {
      const parsed = new URL(wh.url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL inválida: apenas HTTP/HTTPS permitido')
      }
      const host = parsed.hostname.toLowerCase()
      if (
        host === 'localhost' ||
        host === '0.0.0.0' ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host) ||
        host.endsWith('.local') ||
        host === '[::1]'
      ) {
        throw new Error('URL inválida: endereços privados não são permitidos')
      }
    } catch (urlErr) {
      const msg = (urlErr as Error).message
      throw new Error(msg.startsWith('URL inválida') ? msg : 'URL do webhook inválida')
    }

    const testPayload = {
      evento: 'teste',
      dados: {
        mensagem: 'Este é um teste de webhook',
        timestamp: new Date().toISOString(),
        webhook_id: id,
      },
    }

    // AIDEV-NOTE: Seg — Header injection prevention: validar nome do header
    const HEADER_NAME_SAFE = /^[a-zA-Z0-9\-_]+$/
    const FORBIDDEN_HEADERS = new Set(['host', 'content-length', 'transfer-encoding', 'connection'])
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (wh.auth_tipo === 'bearer' && wh.auth_valor) {
      headers['Authorization'] = `Bearer ${wh.auth_valor}`
    } else if (wh.auth_tipo === 'api_key' && wh.auth_header && wh.auth_valor) {
      const headerName = wh.auth_header.trim()
      if (HEADER_NAME_SAFE.test(headerName) && !FORBIDDEN_HEADERS.has(headerName.toLowerCase())) {
        headers[headerName] = wh.auth_valor
      }
    } else if (wh.auth_tipo === 'basic' && wh.auth_header && wh.auth_valor) {
      headers['Authorization'] = `Basic ${btoa(`${wh.auth_header}:${wh.auth_valor}`)}`
    }

    const startTime = Date.now()
    let statusCode: number | null = null
    let responseBody: string | null = null
    let sucesso = false
    let erroMsg: string | null = null

    try {
      const resp = await fetch(wh.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000),
      })
      statusCode = resp.status
      responseBody = await resp.text().catch(() => null)
      sucesso = resp.ok
    } catch (err) {
      erroMsg = (err as Error).message
    }

    const duracao = Date.now() - startTime

    // Registrar log
    await supabase.from('webhooks_saida_logs').insert({
      organizacao_id: orgId,
      webhook_id: id,
      evento: 'teste',
      payload: testPayload as any,
      status_code: statusCode,
      response_body: responseBody?.substring(0, 2000) || null,
      tentativa: 1,
      sucesso,
      erro_mensagem: erroMsg,
      duracao_ms: duracao,
    } as any)

    return { sucesso, status_code: statusCode, duracao_ms: duracao, erro: erroMsg }
  },

  listarLogsSaida: async (id: string, params?: { evento?: string; sucesso?: string; page?: string; limit?: string }) => {
    const page = parseInt(params?.page || '1')
    // AIDEV-NOTE: Seg — cap de 100 para prevenir resource exhaustion
    const limit = Math.min(parseInt(params?.limit || '20'), 100)
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
      papel: 'membro' as const,
      adicionado_em: (m.adicionado_em || m.criado_em) as string,
    }
  })

  return {
    ...(equipeRaw as unknown as Equipe),
    ativa: Boolean(equipeRaw.ativo ?? equipeRaw.ativa ?? true),
    membros,
    total_membros: membros.length,
    lider: null,
  }
}

export const equipeApi = {
  listarEquipes: async (params?: { busca?: string; ativa?: string }) => {
    let query = supabase
      .from('equipes')
      .select(
        `*, membros:equipes_membros(id, usuario_id, criado_em, usuario:usuarios!equipes_membros_usuario_id_fkey(id, nome, sobrenome, email, avatar_url))`,
        { count: 'exact' }
      )
      .is('deletado_em', null)

    if (params?.busca) query = query.ilike('nome', `%${params.busca}%`)
    if (params?.ativa) query = query.eq('ativo', params.ativa === 'true')

    const { data, error, count } = await query.order('nome', { ascending: true })

    if (error) throw new Error(`Erro ao listar equipes: ${error.message}`)
    const equipes = (data || []).map(e => processarEquipeComMembros(e as Record<string, unknown>))
    return { equipes, total: count || 0 }
  },

  buscarEquipe: async (id: string) => {
    const { data, error } = await supabase
      .from('equipes')
      .select(
        `*, membros:equipes_membros(id, usuario_id, criado_em, usuario:usuarios!equipes_membros_usuario_id_fkey(id, nome, sobrenome, email, avatar_url))`
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
    // AIDEV-NOTE: Seg — whitelist Zod + validação de tenant (IDOR + field injection)
    const orgId = await getOrganizacaoId()
    const AtualizarEquipeSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      descricao: z.string().optional(),
      lider_id: z.string().uuid().nullable().optional(),
      cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      ativo: z.boolean().optional(),
    })
    const validated = AtualizarEquipeSchema.parse(payload)

    const { data, error } = await supabase
      .from('equipes')
      .update({ ...validated, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar equipe: ${error.message}`)
    return data as unknown as Equipe
  },

  excluirEquipe: async (id: string) => {
    await supabase.from('equipes_membros').delete().eq('equipe_id', id)

    const { error } = await supabase
      .from('equipes')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir equipe: ${error.message}`)
  },

  adicionarMembro: async (equipeId: string, payload: { usuario_id: string; papel?: 'lider' | 'membro' }) => {
    // AIDEV-NOTE: Seg — validar que equipe e usuário pertencem ao tenant (IDOR cruzado)
    const orgId = await getOrganizacaoId()

    const { data: equipe } = await supabase
      .from('equipes')
      .select('id')
      .eq('id', equipeId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!equipe) throw new Error('Equipe não encontrada')

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', payload.usuario_id)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!usuario) throw new Error('Usuário não encontrado')

    // AIDEV-NOTE: `as any` cirúrgico — coluna `papel` existe na migration 00012 mas tipos gerados estão desatualizados
    const { data, error } = await supabase
      .from('equipes_membros')
      .insert({
        organizacao_id: orgId,
        equipe_id: equipeId,
        usuario_id: payload.usuario_id,
        papel: payload.papel || 'membro',
      } as any)
      .select()
      .single()

    if (error) throw new Error(`Erro ao adicionar membro: ${error.message}`)
    return data
  },

  removerMembro: async (equipeId: string, usuarioId: string) => {
    // AIDEV-NOTE: Seg — validar que equipe pertence ao tenant antes de deletar (IDOR C1)
    const orgId = await getOrganizacaoId()

    const { data: equipe } = await supabase
      .from('equipes')
      .select('id')
      .eq('id', equipeId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!equipe) throw new Error('Equipe não encontrada')

    const { error } = await supabase
      .from('equipes_membros')
      .delete()
      .eq('equipe_id', equipeId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro ao remover membro: ${error.message}`)
  },

  alterarPapelMembro: async (equipeId: string, usuarioId: string, papel: 'lider' | 'membro') => {
    // AIDEV-NOTE: Seg — corrigido bug: papel era ignorado (.update({})); agora salva papel + valida tenant (A1)
    const orgId = await getOrganizacaoId()

    const { data: equipe } = await supabase
      .from('equipes')
      .select('id')
      .eq('id', equipeId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!equipe) throw new Error('Equipe não encontrada')

    // AIDEV-NOTE: `as any` cirúrgico — coluna `papel` existe na migration 00012 mas tipos gerados estão desatualizados
    const { error } = await supabase
      .from('equipes_membros')
      .update({ papel } as any)
      .eq('equipe_id', equipeId)
      .eq('usuario_id', usuarioId)

    if (error) throw new Error(`Erro ao alterar papel: ${error.message}`)
    return { equipeId, usuarioId, papel }
  },

  listarUsuarios: async (params?: Record<string, string>) => {
    const page = parseInt(params?.page || '1')
    // AIDEV-NOTE: Seg — cap de paginação para evitar resource exhaustion (M1)
    const limit = Math.min(parseInt(params?.limit || '20'), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('usuarios')
      .select('id, organizacao_id, nome, sobrenome, email, telefone, avatar_url, perfil_permissao_id, status, ultimo_login, criado_em, atualizado_em, role, deletado_em, papel:perfis_permissao(id, nome)', { count: 'exact' })
      .is('deletado_em', null)

    if (params?.busca) {
      // AIDEV-NOTE: Seg — limite de 50 chars na busca para evitar resource exhaustion (M3)
      const searchTerm = params.busca.substring(0, 50)
      query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }
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
    // AIDEV-NOTE: Seg — whitelist Zod antes de inserir no banco (M2)
    const ConvidarSchema = z.object({
      nome: z.string().min(1).max(100),
      sobrenome: z.string().max(100).optional(),
      email: z.string().email().max(255),
      papel_id: z.string().uuid().optional(),
      equipe_ids: z.array(z.string().uuid()).optional(),
    })
    const validated = ConvidarSchema.parse(payload)

    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // 1. Criar o usuário na tabela
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        organizacao_id: orgId,
        nome: validated.nome,
        sobrenome: validated.sobrenome,
        email: validated.email,
        perfil_permissao_id: validated.papel_id,
        status: 'pendente',
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao convidar usuario: ${error.message}`)

    // 2. Buscar nome da organização e do convidador
    const [orgResult, userResult] = await Promise.all([
      supabase.from('organizacoes_saas').select('nome').eq('id', orgId).maybeSingle(),
      supabase.from('usuarios').select('nome, email').eq('id', userId).maybeSingle(),
    ])

    const orgNome = orgResult.data?.nome || 'CRM'
    const convidadoPor = userResult.data?.nome || ''
    const convidadoPorEmail = userResult.data?.email || ''

    // 3. Chamar edge function para enviar email de convite
    try {
      const { error: fnError } = await supabase.functions.invoke('invite-admin', {
        body: {
          email: validated.email,
          nome: validated.nome,
          sobrenome: validated.sobrenome,
          usuario_id: data.id,
          organizacao_id: orgId,
          organizacao_nome: orgNome,
          role: 'member',
          convidado_por: convidadoPor,
          convidado_por_email: convidadoPorEmail,
        },
      })
      if (fnError) {
        console.error('Erro ao enviar email de convite:', fnError)
      }
    } catch (e) {
      console.error('Erro ao chamar invite-admin:', e)
    }

    return data as unknown as UsuarioTenant
  },

  atualizarUsuario: async (id: string, payload: Record<string, unknown>) => {
    // AIDEV-NOTE: Seg — whitelist Zod: impede injeção de role/organizacao_id (C3)
    const AtualizarUsuarioSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      sobrenome: z.string().max(100).nullable().optional(),
      telefone: z.string().max(20).nullable().optional(),
      perfil_permissao_id: z.string().uuid().nullable().optional(),
      equipe_ids: z.array(z.string().uuid()).optional(),
    })
    const { equipe_ids, ...validated } = AtualizarUsuarioSchema.parse(payload)

    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('usuarios')
      .update({ ...validated, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar usuario: ${error.message}`)
    return data as unknown as UsuarioTenant
  },

  alterarStatusUsuario: async (id: string, payload: { status: string; motivo?: string }) => {
    // AIDEV-NOTE: Seg — validação de tenant: impede alterar status de usuário de outro tenant (C2)
    const orgId = await getOrganizacaoId()
    const StatusSchema = z.object({
      status: z.enum(['ativo', 'inativo', 'pendente', 'suspenso']),
      motivo: z.string().max(500).optional(),
    })
    const validated = StatusSchema.parse(payload)

    const { data, error } = await supabase
      .from('usuarios')
      .update({ status: validated.status, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao alterar status: ${error.message}`)
    return data as unknown as UsuarioTenant
  },

  reenviarConvite: async (id: string) => {
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Buscar dados do usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, sobrenome, email')
      .eq('id', id)
      .maybeSingle()

    if (userError || !usuario) throw new Error('Usuário não encontrado')

    // Buscar nome da organização e convidador
    const [orgResult, inviterResult] = await Promise.all([
      supabase.from('organizacoes_saas').select('nome').eq('id', orgId).maybeSingle(),
      supabase.from('usuarios').select('nome, email').eq('id', userId).maybeSingle(),
    ])

    const { error: fnError } = await supabase.functions.invoke('invite-admin', {
      body: {
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        usuario_id: usuario.id,
        organizacao_id: orgId,
        organizacao_nome: orgResult.data?.nome || 'CRM',
        convidado_por: inviterResult.data?.nome || '',
        convidado_por_email: inviterResult.data?.email || '',
      },
    })

    if (fnError) throw new Error(`Erro ao reenviar convite: ${fnError.message}`)
    return { success: true }
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
    // AIDEV-NOTE: Seg — whitelist Zod: impede injeção de is_admin/is_sistema/organizacao_id (C5)
    const PerfilSchema = z.object({
      nome: z.string().min(1).max(100),
      descricao: z.string().optional(),
      permissoes: z.array(z.object({
        modulo: z.enum(['negocios', 'contatos', 'conversas', 'tarefas', 'metas', 'relatorios', 'configuracoes']),
        acoes: z.array(z.enum(['visualizar', 'criar', 'editar', 'excluir', 'gerenciar'])).min(1),
      })).optional(),
    })
    const validated = PerfilSchema.parse(payload)
    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('perfis_permissao')
      .insert({ organizacao_id: orgId, ...validated })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar perfil: ${error.message}`)
    return data as unknown as PerfilPermissao
  },

  atualizarPerfil: async (id: string, payload: Record<string, unknown>) => {
    // AIDEV-NOTE: Seg — whitelist Zod + validação de tenant: impede injeção de is_admin/is_sistema (C5)
    const AtualizarPerfilSchema = z.object({
      nome: z.string().min(1).max(100).optional(),
      descricao: z.string().optional(),
      permissoes: z.array(z.object({
        modulo: z.enum(['negocios', 'contatos', 'conversas', 'tarefas', 'metas', 'relatorios', 'configuracoes']),
        acoes: z.array(z.enum(['visualizar', 'criar', 'editar', 'excluir', 'gerenciar'])).min(1),
      })).optional(),
    })
    const validated = AtualizarPerfilSchema.parse(payload)
    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('perfis_permissao')
      .update({ ...validated, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
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
    ativa: Boolean(metaRaw.ativo ?? metaRaw.ativa ?? true),
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
    // AIDEV-NOTE: Seg — cap de paginação para evitar resource exhaustion (A5)
    const page = parseInt(params?.page || '1')
    const limit = Math.min(parseInt(params?.limit || '50'), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('metas')
      .select(
        `*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios!metas_usuario_id_fkey(id, nome, sobrenome)`,
        { count: 'exact' }
      )
      .is('deletado_em', null)

    if (params?.tipo) query = query.eq('tipo', params.tipo)
    if (params?.metrica) query = query.eq('metrica', params.metrica)
    if (params?.periodo) query = query.eq('periodo', params.periodo)
    if (params?.equipe_id) query = query.eq('equipe_id', params.equipe_id)
    if (params?.usuario_id) query = query.eq('usuario_id', params.usuario_id)
    if (params?.ativa) query = query.eq('ativo', params.ativa === 'true')

    const { data, error, count } = await query
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Erro ao listar metas: ${error.message}`)
    const metas = (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>))
    return { metas, total: count || 0 }
  },

  buscar: async (id: string) => {
    const { data, error } = await supabase
      .from('metas')
      .select(
        `*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios!metas_usuario_id_fkey(id, nome, sobrenome)`
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
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em), equipe:equipes(id, nome), usuario:usuarios!metas_usuario_id_fkey(id, nome, sobrenome)`)
      .eq('meta_pai_id', id)
      .is('deletado_em', null)

    const metasFilhas = (filhas || []).map(f => processarMetaProgresso(f as Record<string, unknown>))

    return { ...metaProcessada, metas_filhas: metasFilhas } as MetaDetalhada
  },

  criar: async (payload: Record<string, unknown>) => {
    // AIDEV-NOTE: Seg — whitelist Zod + validação cross-tenant de usuario_id/equipe_id (C4/A4)
    const CriarMetaSchema = z.object({
      tipo: z.enum(['empresa', 'equipe', 'individual']),
      nome: z.string().min(1).max(255),
      metrica: z.enum(['valor_vendas', 'mrr', 'ticket_medio', 'quantidade_vendas', 'novos_negocios', 'taxa_conversao', 'reunioes', 'ligacoes', 'emails', 'tarefas', 'novos_contatos', 'mqls', 'sqls', 'tempo_fechamento', 'velocidade_pipeline']),
      valor_meta: z.number().positive().max(999_999_999),
      periodo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']),
      data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      equipe_id: z.string().uuid().optional(),
      usuario_id: z.string().uuid().optional(),
      funil_id: z.string().uuid().optional(),
      meta_pai_id: z.string().uuid().optional(),
    })
    const validated = CriarMetaSchema.parse(payload)
    const orgId = await getOrganizacaoId()
    const userId = await getUsuarioId()

    // Validar que usuario_id pertence ao tenant (se individual)
    if (validated.tipo === 'individual' && validated.usuario_id) {
      const { data: usr } = await supabase
        .from('usuarios').select('id').eq('id', validated.usuario_id).eq('organizacao_id', orgId).maybeSingle()
      if (!usr) throw new Error('Usuário não encontrado')
    }

    // Validar que equipe_id pertence ao tenant (se equipe)
    if (validated.tipo === 'equipe' && validated.equipe_id) {
      const { data: eq } = await supabase
        .from('equipes').select('id').eq('id', validated.equipe_id).eq('organizacao_id', orgId).maybeSingle()
      if (!eq) throw new Error('Equipe não encontrada')
    }

    const { data, error } = await supabase
      .from('metas')
      .insert({ organizacao_id: orgId, ...validated, criado_por: userId })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar meta: ${error.message}`)

    // Criar registro de progresso inicial
    await supabase.from('metas_progresso').insert({
      organizacao_id: orgId,
      meta_id: data.id,
      valor_atual: 0,
      percentual_atingido: 0,
    })

    return data as unknown as Meta
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    // AIDEV-NOTE: Seg — whitelist Zod + validação de tenant: impede injeção de organizacao_id/criado_por (C4)
    const AtualizarMetaSchema = z.object({
      nome: z.string().min(1).max(255).optional(),
      valor_meta: z.number().positive().max(999_999_999).optional(),
      data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      ativo: z.boolean().optional(),
      funil_id: z.string().uuid().nullable().optional(),
    })
    const validated = AtualizarMetaSchema.parse(payload)
    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('metas')
      .update({ ...validated, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('organizacao_id', orgId)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)
    return data as unknown as Meta
  },

  excluir: async (id: string) => {
    // Excluir metas filhas primeiro
    await supabase
      .from('metas')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
      .eq('meta_pai_id', id)

    const { error } = await supabase
      .from('metas')
      .update({ deletado_em: new Date().toISOString(), ativo: false })
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
    // AIDEV-NOTE: Limit de segurança para evitar downloads massivos
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(id, valor_atual, percentual_atingido, calculado_em)`)
      .eq('tipo', 'empresa')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .limit(50)

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
      .eq('ativo', true)
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
      .eq('ativo', true)
      .is('deletado_em', null)

    if (error) throw new Error(`Erro ao buscar metas individuais: ${error.message}`)
    return { metas: (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>)) as MetaComProgresso[], total: count || 0 }
  },

  buscarProgresso: async () => {
    // AIDEV-NOTE: Limit de segurança para evitar downloads massivos
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(valor_atual, percentual_atingido)`)
      .eq('ativo', true)
      .is('deletado_em', null)
      .limit(100)

    if (error) throw new Error(`Erro ao buscar progresso: ${error.message}`)
    return { total: data?.length || 0, metas: data }
  },

  buscarRanking: async (params?: Record<string, string>) => {
    // AIDEV-NOTE: Limit de segurança para evitar downloads massivos
    const { data, error } = await supabase
      .from('metas')
      .select(`*, progresso:metas_progresso(valor_atual, percentual_atingido), usuario:usuarios!metas_usuario_id_fkey(id, nome, sobrenome, avatar_url)`)
      .eq('tipo', 'individual')
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .limit(100)

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
      .eq('ativo', true)
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })

    if (error) throw new Error(`Erro ao buscar minhas metas: ${error.message}`)
    return { metas: (data || []).map(m => processarMetaProgresso(m as Record<string, unknown>)) }
  },
}

// =====================================================
// API Functions - Configurações do Tenant
// =====================================================

// AIDEV-NOTE: Seg — schema Zod para prevenir field injection em configuracoes_tenant
const ConfiguracaoTenantInputSchema = z.object({
  moeda_padrao: z.enum(['BRL', 'USD', 'EUR']).optional(),
  timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Timezone inválido').optional(),
  formato_data: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  notificar_nova_oportunidade: z.boolean().optional(),
  notificar_tarefa_vencida: z.boolean().optional(),
  notificar_mudanca_etapa: z.boolean().optional(),
  criar_tarefa_automatica: z.boolean().optional(),
  dias_alerta_inatividade: z.number().int().min(1).max(90).optional(),
  assinatura_mensagem: z.string().max(50000).optional(),
  horario_inicio_envio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido HH:MM').optional(),
  horario_fim_envio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido HH:MM').optional(),
  widget_whatsapp_ativo: z.boolean().optional(),
  widget_whatsapp_config: z.object({
    ativo: z.boolean().optional(),
    numero: z.string().max(20).optional(),
    posicao: z.enum(['direita', 'esquerda']).optional(),
    usar_formulario: z.boolean().optional(),
    campos_formulario: z.array(z.string()).optional(),
    campos_obrigatorios: z.array(z.string()).optional(),
    nome_atendente: z.string().max(100).optional(),
    foto_atendente_url: z.string().max(500).optional().or(z.literal('')),
    mensagem_boas_vindas: z.string().max(500).optional(),
    cor_botao: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    funil_id: z.string().optional(),
    notificar_email: z.boolean().optional(),
    email_destino: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
    horario_atendimento: z.enum(['sempre', 'personalizado']).optional(),
    horario_dias: z.array(z.number().int().min(0).max(6)).optional(),
    horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido HH:MM').optional(),
    horario_fim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido HH:MM').optional(),
  }).optional(),
})

export const configTenantApi = {
  buscar: async () => {
    const { data, error } = await supabase
      .from('configuracoes_tenant')
      .select('*')
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar configurações: ${error.message}`)
    return data as unknown as ConfiguracaoTenant | null
  },

  // AIDEV-NOTE: Upsert otimizado — 1 query ao invés de 2 (SELECT+UPDATE/INSERT)
  atualizar: async (payload: unknown) => {
    // AIDEV-NOTE: Seg — validação Zod previne field injection (apenas campos conhecidos são aceitos)
    const validated = ConfiguracaoTenantInputSchema.parse(payload)
    const orgId = await getOrganizacaoId()

    const { data, error } = await supabase
      .from('configuracoes_tenant')
      .upsert(
        { organizacao_id: orgId, ...validated, atualizado_em: new Date().toISOString() } as any,
        { onConflict: 'organizacao_id' }
      )
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar configurações: ${error.message}`)
    return data as unknown as ConfiguracaoTenant
  },
}

// =====================================================
// Vínculos de itens globais com pipelines
// =====================================================

export interface VinculoPipeline {
  funil_id: string
  funil_nome: string
}

export const vinculosPipelinesApi = {
  /**
   * Busca pipelines vinculadas a um campo customizado via funis_campos
   */
  buscarVinculosCampo: async (campoId: string): Promise<VinculoPipeline[]> => {
    const { data, error } = await supabase
      .from('funis_campos')
      .select('funil_id, funis!inner(nome)')
      .eq('campo_id', campoId)

    if (error) throw new Error(`Erro ao buscar vínculos do campo: ${error.message}`)
    return (data || []).map((row: any) => ({
      funil_id: row.funil_id,
      funil_nome: row.funis?.nome || 'Pipeline',
    }))
  },

  /**
   * Busca pipelines vinculadas a uma etapa template via etapas_funil
   */
  buscarVinculosEtapa: async (etapaTemplateId: string): Promise<VinculoPipeline[]> => {
    const { data, error } = await supabase
      .from('etapas_funil')
      .select('funil_id, funis!inner(nome)')
      .eq('etapa_template_id', etapaTemplateId)

    if (error) throw new Error(`Erro ao buscar vínculos da etapa: ${error.message}`)
    return (data || []).map((row: any) => ({
      funil_id: row.funil_id,
      funil_nome: row.funis?.nome || 'Pipeline',
    }))
  },

  /**
   * Busca pipelines vinculadas a uma tarefa template via funis_etapas_tarefas → etapas_funil → funis
   */
  buscarVinculosTarefa: async (tarefaTemplateId: string): Promise<VinculoPipeline[]> => {
    const { data, error } = await supabase
      .from('funis_etapas_tarefas')
      .select('etapa_funil_id, etapas_funil!inner(funil_id, funis!inner(nome))')
      .eq('tarefa_template_id', tarefaTemplateId)

    if (error) throw new Error(`Erro ao buscar vínculos da tarefa: ${error.message}`)
    // Deduplicate by funil_id
    const map = new Map<string, string>()
    for (const row of (data || []) as any[]) {
      const funilId = row.etapas_funil?.funil_id
      const funilNome = row.etapas_funil?.funis?.nome || 'Pipeline'
      if (funilId && !map.has(funilId)) map.set(funilId, funilNome)
    }
    return Array.from(map.entries()).map(([funil_id, funil_nome]) => ({ funil_id, funil_nome }))
  },

  /**
   * Busca pipelines vinculadas a um motivo via funis_motivos
   */
  buscarVinculosMotivo: async (motivoId: string): Promise<VinculoPipeline[]> => {
    const { data, error } = await supabase
      .from('funis_motivos')
      .select('funil_id, funis!inner(nome)')
      .eq('motivo_id', motivoId)

    if (error) throw new Error(`Erro ao buscar vínculos do motivo: ${error.message}`)
    return (data || []).map((row: any) => ({
      funil_id: row.funil_id,
      funil_nome: row.funis?.nome || 'Pipeline',
    }))
  },

  /**
   * Busca pipelines vinculadas a uma regra de qualificação via funis_regras_qualificacao
   * AIDEV-NOTE: Seg — valida que regraId pertence ao tenant antes de buscar vínculos
   */
  buscarVinculosRegra: async (regraId: string): Promise<VinculoPipeline[]> => {
    const orgId = await getOrganizacaoId()
    // Validar que a regra pertence ao tenant
    const { data: regra } = await supabase
      .from('regras_qualificacao')
      .select('id')
      .eq('id', regraId)
      .eq('organizacao_id', orgId)
      .maybeSingle()
    if (!regra) throw new Error('Regra não encontrada')

    const { data, error } = await supabase
      .from('funis_regras_qualificacao')
      .select('funil_id, funis!inner(nome)')
      .eq('regra_id', regraId)

    if (error) throw new Error(`Erro ao buscar vínculos da regra: ${error.message}`)
    return (data || []).map((row: any) => ({
      funil_id: row.funil_id,
      funil_nome: row.funis?.nome || 'Pipeline',
    }))
  },

  /**
   * Busca vínculos em lote para múltiplos campos (usado na CamposList)
   * AIDEV-NOTE: Seg — filtra por organizacao_id para garantir isolamento de tenant
   */
  buscarVinculosCamposEmLote: async (campoIds: string[]): Promise<Record<string, VinculoPipeline[]>> => {
    if (campoIds.length === 0) return {}

    const orgId = await getOrganizacaoId()
    const { data, error } = await supabase
      .from('funis_campos')
      .select('campo_id, funil_id, funis!inner(nome)')
      .in('campo_id', campoIds)
      .eq('organizacao_id', orgId)

    if (error) throw new Error(`Erro ao buscar vínculos em lote: ${error.message}`)

    const result: Record<string, VinculoPipeline[]> = {}
    for (const row of (data || []) as any[]) {
      if (!result[row.campo_id]) result[row.campo_id] = []
      result[row.campo_id].push({
        funil_id: row.funil_id,
        funil_nome: row.funis?.nome || 'Pipeline',
      })
    }
    return result
  },
}
