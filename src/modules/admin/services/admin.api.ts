import { api } from '@/lib/api'

/**
 * AIDEV-NOTE: API client para endpoints do Super Admin
 * Conforme PRD-14 - Painel Super Admin
 *
 * Prefixo: /v1/admin
 */

// =======================
// TIPOS
// =======================

export interface Organizacao {
  id: string
  nome: string
  segmento: string
  email: string
  website: string | null
  telefone: string | null
  status: 'ativa' | 'suspensa' | 'trial' | 'cancelada'
  plano_id: string | null
  criado_em: string
  admin?: {
    id: string
    nome: string
    sobrenome: string
    email: string
    status: string
    ultimo_login: string | null
  }
  plano?: {
    id: string
    nome: string
  }
}

export interface ListaOrganizacoesResponse {
  organizacoes: Organizacao[]
  total: number
  pagina: number
  limite: number
  total_paginas: number
}

export interface CriarOrganizacaoPayload {
  // Etapa 1
  nome: string
  segmento: string
  email: string
  website?: string
  telefone?: string
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
  }
  // Etapa 2
  numero_usuarios: string
  volume_leads_mes: string
  principal_objetivo: string
  como_conheceu?: string
  observacoes?: string
  // Etapa 3
  admin_nome: string
  admin_sobrenome: string
  admin_email: string
  admin_telefone?: string
  enviar_convite: boolean
  senha_inicial?: string
}

export interface Plano {
  id: string
  nome: string
  descricao: string | null
  preco_mensal: number
  preco_anual: number | null
  moeda: string
  limite_usuarios: number
  limite_oportunidades: number | null
  limite_storage_mb: number
  limite_contatos: number | null
  ativo: boolean
  visivel: boolean
  ordem: number
}

export interface Modulo {
  id: string
  slug: string
  nome: string
  descricao: string
  icone: string
  obrigatorio: boolean
  ordem: number
  requer: string[]
  ativo?: boolean
  configuracoes?: Record<string, unknown>
}

export interface ConfigGlobal {
  id: string
  plataforma: string
  configuracoes: Record<string, unknown>
  configurado: boolean
  ultimo_teste: string | null
  ultimo_erro: string | null
}

export interface MetricasResumo {
  tenants: {
    total: number
    ativos: number
    trial: number
    suspensos: number
    novos_7d: number
    novos_30d: number
  }
  usuarios: {
    total: number
    ativos_hoje: number
    ativos_7d: number
  }
  financeiro: {
    mrr: number
    variacao_mrr: number
  }
  distribuicao_planos: Array<{
    plano: string
    quantidade: number
    percentual: number
  }>
  alertas: Array<{
    tipo: 'warning' | 'info' | 'error'
    mensagem: string
    quantidade: number
  }>
}

export interface LimitesUso {
  usuarios: { usado: number; limite: number; percentual: number }
  oportunidades: { usado: number; limite: number | null; percentual: number | null }
  storage: { usado_mb: number; limite_mb: number; percentual: number }
  contatos: { usado: number; limite: number | null; percentual: number | null }
}

// =======================
// ORGANIZACOES
// =======================

export async function listarOrganizacoes(params?: {
  page?: number
  limit?: number
  busca?: string
  status?: string
  plano?: string
  segmento?: string
}): Promise<ListaOrganizacoesResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.busca) query.set('busca', params.busca)
  if (params?.status) query.set('status', params.status)
  if (params?.plano) query.set('plano', params.plano)
  if (params?.segmento) query.set('segmento', params.segmento)

  const response = await api.get<{ success: boolean; data: ListaOrganizacoesResponse }>(
    `/v1/admin/organizacoes?${query.toString()}`
  )
  return response.data.data
}

export async function obterOrganizacao(id: string): Promise<Organizacao> {
  const response = await api.get<{ success: boolean; data: Organizacao }>(
    `/v1/admin/organizacoes/${id}`
  )
  return response.data.data
}

export async function criarOrganizacao(data: CriarOrganizacaoPayload): Promise<{ organizacao_id: string; admin_id: string }> {
  const response = await api.post<{ success: boolean; data: { organizacao_id: string; admin_id: string } }>(
    '/v1/admin/organizacoes',
    data
  )
  return response.data.data
}

export async function atualizarOrganizacao(id: string, data: Partial<Organizacao>): Promise<void> {
  await api.patch(`/v1/admin/organizacoes/${id}`, data)
}

export async function suspenderOrganizacao(id: string, motivo: string): Promise<void> {
  await api.post(`/v1/admin/organizacoes/${id}/suspender`, { motivo })
}

export async function reativarOrganizacao(id: string): Promise<void> {
  await api.post(`/v1/admin/organizacoes/${id}/reativar`)
}

export async function impersonarOrganizacao(id: string, motivo: string): Promise<{ organizacao_id: string; organizacao_nome: string }> {
  const response = await api.post<{ success: boolean; data: { organizacao_id: string; organizacao_nome: string } }>(
    `/v1/admin/organizacoes/${id}/impersonar`,
    { motivo }
  )
  return response.data.data
}

export async function listarUsuariosOrganizacao(id: string): Promise<{
  admin?: { id: string; nome: string; sobrenome: string; email: string; status: string; ultimo_login: string | null }
  members: Array<{ id: string; nome: string; sobrenome: string; email: string; status: string; ultimo_login: string | null; criado_em: string }>
  total: number
}> {
  const response = await api.get<{ success: boolean; data: { admin: unknown; members: unknown[]; total: number } }>(
    `/v1/admin/organizacoes/${id}/usuarios`
  )
  return response.data.data as ReturnType<typeof listarUsuariosOrganizacao> extends Promise<infer T> ? T : never
}

export async function obterLimitesOrganizacao(id: string): Promise<LimitesUso> {
  const response = await api.get<{ success: boolean; data: LimitesUso }>(
    `/v1/admin/organizacoes/${id}/limites`
  )
  return response.data.data
}

export async function obterModulosOrganizacao(id: string): Promise<Modulo[]> {
  const response = await api.get<{ success: boolean; data: Modulo[] }>(
    `/v1/admin/organizacoes/${id}/modulos`
  )
  return response.data.data
}

export async function atualizarModulosOrganizacao(id: string, modulos: Array<{ modulo_id: string; ativo: boolean; ordem?: number }>): Promise<void> {
  await api.put(`/v1/admin/organizacoes/${id}/modulos`, { modulos })
}

// =======================
// PLANOS
// =======================

export async function listarPlanos(): Promise<Plano[]> {
  const response = await api.get<{ success: boolean; data: Plano[] }>('/v1/admin/planos')
  return response.data.data
}

export async function obterPlano(id: string): Promise<Plano & { modulos: Modulo[] }> {
  const response = await api.get<{ success: boolean; data: Plano & { modulos: Modulo[] } }>(
    `/v1/admin/planos/${id}`
  )
  return response.data.data
}

export async function criarPlano(data: Omit<Plano, 'id'>): Promise<string> {
  const response = await api.post<{ success: boolean; data: { id: string } }>(
    '/v1/admin/planos',
    data
  )
  return response.data.data.id
}

export async function atualizarPlano(id: string, data: Partial<Plano>): Promise<void> {
  await api.patch(`/v1/admin/planos/${id}`, data)
}

export async function definirModulosPlano(planoId: string, modulos: Array<{ modulo_id: string; configuracoes?: Record<string, unknown> }>): Promise<void> {
  await api.put(`/v1/admin/planos/${planoId}/modulos`, { modulos })
}

// =======================
// MODULOS
// =======================

export async function listarModulos(): Promise<Modulo[]> {
  const response = await api.get<{ success: boolean; data: Modulo[] }>('/v1/admin/modulos')
  return response.data.data
}

// =======================
// CONFIGURACOES GLOBAIS
// =======================

export async function listarConfigGlobais(): Promise<ConfigGlobal[]> {
  const response = await api.get<{ success: boolean; data: ConfigGlobal[] }>('/v1/admin/config-global')
  return response.data.data
}

export async function obterConfigGlobal(plataforma: string): Promise<ConfigGlobal> {
  const response = await api.get<{ success: boolean; data: ConfigGlobal }>(
    `/v1/admin/config-global/${plataforma}`
  )
  return response.data.data
}

export async function atualizarConfigGlobal(plataforma: string, configuracoes: Record<string, unknown>): Promise<void> {
  await api.patch(`/v1/admin/config-global/${plataforma}`, { configuracoes })
}

export async function testarConfigGlobal(plataforma: string): Promise<{ sucesso: boolean; mensagem: string }> {
  const response = await api.post<{ success: boolean; data: { sucesso: boolean; mensagem: string } }>(
    `/v1/admin/config-global/${plataforma}/testar`
  )
  return response.data.data
}

// =======================
// METRICAS
// =======================

export async function obterMetricasResumo(periodo: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<MetricasResumo> {
  const response = await api.get<{ success: boolean; data: MetricasResumo }>(
    `/v1/admin/metricas/resumo?periodo=${periodo}`
  )
  return response.data.data
}

export async function obterMetricasFinanceiro(periodo: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<{
  mrr: number
  churn_rate: number
  novos_clientes: number
  cancelamentos: number
}> {
  const response = await api.get<{ success: boolean; data: { mrr: number; churn_rate: number; novos_clientes: number; cancelamentos: number } }>(
    `/v1/admin/metricas/financeiro?periodo=${periodo}`
  )
  return response.data.data
}

// Export como objeto para uso com useQuery
export const adminApi = {
  // Organizacoes
  listarOrganizacoes,
  obterOrganizacao,
  criarOrganizacao,
  atualizarOrganizacao,
  suspenderOrganizacao,
  reativarOrganizacao,
  impersonarOrganizacao,
  listarUsuariosOrganizacao,
  obterLimitesOrganizacao,
  obterModulosOrganizacao,
  atualizarModulosOrganizacao,
  // Planos
  listarPlanos,
  obterPlano,
  criarPlano,
  atualizarPlano,
  definirModulosPlano,
  // Modulos
  listarModulos,
  // Config Global
  listarConfigGlobais,
  obterConfigGlobal,
  atualizarConfigGlobal,
  testarConfigGlobal,
  // Metricas
  obterMetricasResumo,
  obterMetricasFinanceiro,
}
