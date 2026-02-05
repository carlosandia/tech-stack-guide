/**
 * AIDEV-NOTE: Service layer para o módulo de Configurações
 * Todas as chamadas via Axios ao backend Express
 * Conforme PRD-05 - Configurações do Tenant
 *
 * IMPORTANTE: Nunca adicione /api/ ao prefix - baseURL já inclui /api
 */

import api from '@/lib/api'

// =====================================================
// Types
// =====================================================

// Campos Personalizados
export type Entidade = 'contato' | 'pessoa' | 'empresa' | 'oportunidade'
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
export interface Usuario {
  id: string
  nome: string
  sobrenome?: string | null
  email: string
  telefone?: string | null
  avatar_url?: string | null
  role: string
  status: string
  ultimo_login?: string | null
}

export interface Equipe {
  id: string
  nome: string
  descricao?: string | null
  cor?: string | null
  ativo: boolean
  criado_em: string
}

export interface PerfilPermissao {
  id: string
  nome: string
  descricao?: string | null
  sistema: boolean
  permissoes: Record<string, unknown>
  criado_em: string
}

// Metas
export interface Meta {
  id: string
  organizacao_id: string
  nome: string
  tipo: string
  metrica: string
  valor_alvo: number
  valor_atual: number
  periodo: string
  inicio: string
  fim: string
  ativa: boolean
  criado_em: string
}

// =====================================================
// API Functions - Campos
// =====================================================

export const camposApi = {
  listar: async (entidade: Entidade) => {
    const { data } = await api.get('/v1/campos', { params: { entidade } })
    return data as { campos: CampoCustomizado[]; total: number }
  },

  buscar: async (id: string) => {
    const { data } = await api.get(`/v1/campos/${id}`)
    return data as CampoCustomizado
  },

  criar: async (payload: CriarCampoPayload) => {
    const { data } = await api.post('/v1/campos', payload)
    return data as CampoCustomizado
  },

  atualizar: async (id: string, payload: AtualizarCampoPayload) => {
    const { data } = await api.patch(`/v1/campos/${id}`, payload)
    return data as CampoCustomizado
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/campos/${id}`)
  },

  reordenar: async (entidade: Entidade, ordem: Array<{ id: string; ordem: number }>) => {
    await api.patch('/v1/campos/reordenar', { entidade, ordem })
  },
}

// =====================================================
// API Functions - Produtos
// =====================================================

export const produtosApi = {
  listar: async (params?: { categoria_id?: string; busca?: string; ativo?: string; recorrente?: string; page?: string; limit?: string }) => {
    const { data } = await api.get('/v1/produtos', { params })
    return data as { produtos: Produto[]; total: number; page: number; total_paginas: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/produtos', payload)
    return data as Produto
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/produtos/${id}`, payload)
    return data as Produto
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/produtos/${id}`)
  },

  // Categorias - URL corrigida: backend registra em /v1/categorias-produtos
  listarCategorias: async () => {
    const { data } = await api.get('/v1/categorias-produtos/categorias')
    return data as { categorias: Categoria[]; total: number }
  },

  criarCategoria: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/categorias-produtos/categorias', payload)
    return data as Categoria
  },

  atualizarCategoria: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/categorias-produtos/categorias/${id}`, payload)
    return data as Categoria
  },

  excluirCategoria: async (id: string) => {
    await api.delete(`/v1/categorias-produtos/categorias/${id}`)
  },
}

// =====================================================
// API Functions - Motivos
// =====================================================

export const motivosApi = {
  listar: async (tipo?: TipoMotivo) => {
    const { data } = await api.get('/v1/motivos-resultado', { params: tipo ? { tipo } : {} })
    return data as { motivos: MotivoResultado[]; total: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/motivos-resultado', payload)
    return data as MotivoResultado
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/motivos-resultado/${id}`, payload)
    return data as MotivoResultado
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/motivos-resultado/${id}`)
  },

  reordenar: async (tipo: TipoMotivo, ordem: Array<{ id: string; ordem: number }>) => {
    await api.patch('/v1/motivos-resultado/reordenar', { tipo, ordem })
  },
}

// =====================================================
// API Functions - Tarefas Templates
// =====================================================

export const tarefasTemplatesApi = {
  listar: async (params?: { tipo?: string; ativo?: string }) => {
    const { data } = await api.get('/v1/tarefas-templates', { params })
    return data as { templates: TarefaTemplate[]; total: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/tarefas-templates', payload)
    return data as TarefaTemplate
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/tarefas-templates/${id}`, payload)
    return data as TarefaTemplate
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/tarefas-templates/${id}`)
  },
}

// =====================================================
// API Functions - Etapas Templates
// =====================================================

export const etapasTemplatesApi = {
  listar: async (params?: { tipo?: string; ativo?: string }) => {
    const { data } = await api.get('/v1/etapas-templates', { params })
    return data as { templates: EtapaTemplate[]; total: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/etapas-templates', payload)
    return data as EtapaTemplate
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/etapas-templates/${id}`, payload)
    return data as EtapaTemplate
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/etapas-templates/${id}`)
  },

  reordenar: async (ordem: Array<{ id: string; ordem: number }>) => {
    await api.patch('/v1/etapas-templates/reordenar', { ordem })
  },

  vincularTarefa: async (etapaId: string, payload: Record<string, unknown>) => {
    const { data } = await api.post(`/v1/etapas-templates/${etapaId}/tarefas`, payload)
    return data
  },

  desvincularTarefa: async (etapaId: string, tarefaId: string) => {
    await api.delete(`/v1/etapas-templates/${etapaId}/tarefas/${tarefaId}`)
  },
}

// =====================================================
// API Functions - Regras de Qualificação
// =====================================================

export const regrasApi = {
  listar: async (params?: { ativa?: string }) => {
    const { data } = await api.get('/v1/regras-qualificacao', { params })
    return data as { regras: RegraQualificacao[]; total: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/regras-qualificacao', payload)
    return data as RegraQualificacao
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/regras-qualificacao/${id}`, payload)
    return data as RegraQualificacao
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/regras-qualificacao/${id}`)
  },

  reordenar: async (prioridades: Array<{ id: string; prioridade: number }>) => {
    await api.patch('/v1/regras-qualificacao/reordenar', { prioridades })
  },
}

// =====================================================
// API Functions - Configuração de Cards
// =====================================================

export const configCardApi = {
  buscar: async (funil_id?: string) => {
    const { data } = await api.get('/v1/configuracoes-card', { params: funil_id ? { funil_id } : {} })
    return data as ConfiguracaoCard
  },

  atualizar: async (payload: Record<string, unknown>) => {
    const { data } = await api.put('/v1/configuracoes-card', payload)
    return data as ConfiguracaoCard
  },
}

// =====================================================
// API Functions - Integracoes
// =====================================================

export const integracoesApi = {
  listar: async () => {
    const { data } = await api.get('/v1/integracoes')
    return data as { integracoes: Integracao[]; total: number }
  },

  buscar: async (id: string) => {
    const { data } = await api.get(`/v1/integracoes/${id}`)
    return data as Integracao
  },

  obterAuthUrl: async (plataforma: PlataformaIntegracao, redirect_uri: string) => {
    const { data } = await api.get(`/v1/integracoes/${plataforma}/auth-url`, {
      params: { redirect_uri },
    })
    return data as { url: string }
  },

  processarCallback: async (plataforma: PlataformaIntegracao, payload: { code: string; state: string; redirect_uri: string }) => {
    const { data } = await api.post(`/v1/integracoes/${plataforma}/callback`, payload)
    return data as Integracao
  },

  desconectar: async (id: string) => {
    await api.delete(`/v1/integracoes/${id}`)
  },

  sincronizar: async (id: string) => {
    const { data } = await api.post(`/v1/integracoes/${id}/sync`)
    return data as { sucesso: boolean; mensagem: string }
  },
}

// =====================================================
// API Functions - Webhooks
// NOTA: Backend monta webhooksRoutes em /v1/webhooks-entrada e /v1/webhooks-saida
// As sub-rotas internas sao /entrada e /saida
// =====================================================

export const webhooksApi = {
  // Webhooks de Entrada - usa /v1/webhooks-entrada/entrada
  listarEntrada: async () => {
    const { data } = await api.get('/v1/webhooks-entrada/entrada')
    return data as { webhooks: WebhookEntrada[]; total: number }
  },

  criarEntrada: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/webhooks-entrada/entrada', payload)
    return data as WebhookEntrada
  },

  atualizarEntrada: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/webhooks-entrada/entrada/${id}`, payload)
    return data as WebhookEntrada
  },

  excluirEntrada: async (id: string) => {
    await api.delete(`/v1/webhooks-entrada/entrada/${id}`)
  },

  regenerarToken: async (id: string) => {
    const { data } = await api.post(`/v1/webhooks-entrada/entrada/${id}/regenerar-token`)
    return data as WebhookEntrada
  },

  // Webhooks de Saída - usa /v1/webhooks-saida/saida
  listarSaida: async () => {
    const { data } = await api.get('/v1/webhooks-saida/saida')
    return data as { webhooks: WebhookSaida[]; total: number }
  },

  criarSaida: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/webhooks-saida/saida', payload)
    return data as WebhookSaida
  },

  atualizarSaida: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/webhooks-saida/saida/${id}`, payload)
    return data as WebhookSaida
  },

  excluirSaida: async (id: string) => {
    await api.delete(`/v1/webhooks-saida/saida/${id}`)
  },

  testarSaida: async (id: string) => {
    const { data } = await api.post(`/v1/webhooks-saida/saida/${id}/testar`)
    return data as { sucesso: boolean; status_code?: number; mensagem?: string }
  },

  listarLogsSaida: async (id: string, params?: { evento?: string; sucesso?: string; page?: string; limit?: string }) => {
    const { data } = await api.get(`/v1/webhooks-saida/saida/${id}/logs`, { params })
    return data as { logs: WebhookSaidaLog[]; total: number; page: number; total_paginas: number }
  },
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
// API Functions - Equipe
// =====================================================

export const equipeApi = {
  listarEquipes: async (params?: { busca?: string; ativa?: string }) => {
    const { data } = await api.get('/v1/equipes', { params })
    return data as { equipes: Equipe[]; total: number }
  },

  criarEquipe: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/equipes', payload)
    return data as Equipe
  },

  atualizarEquipe: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/equipes/${id}`, payload)
    return data as Equipe
  },

  excluirEquipe: async (id: string) => {
    await api.delete(`/v1/equipes/${id}`)
  },

  listarUsuarios: async (params?: Record<string, string>) => {
    const { data } = await api.get('/v1/usuarios', { params })
    return data as { usuarios: Usuario[]; total: number }
  },

  convidarUsuario: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/usuarios', payload)
    return data as Usuario
  },

  atualizarUsuario: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/usuarios/${id}`, payload)
    return data as Usuario
  },

  alterarStatusUsuario: async (id: string, payload: { status: string }) => {
    const { data } = await api.patch(`/v1/usuarios/${id}/status`, payload)
    return data as Usuario
  },

  reenviarConvite: async (id: string) => {
    const { data } = await api.post(`/v1/usuarios/${id}/reenviar-convite`)
    return data
  },

  listarPerfis: async () => {
    const { data } = await api.get('/v1/perfis-permissao')
    return data as { perfis: PerfilPermissao[]; total: number }
  },

  criarPerfil: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/perfis-permissao', payload)
    return data as PerfilPermissao
  },

  atualizarPerfil: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/perfis-permissao/${id}`, payload)
    return data as PerfilPermissao
  },

  excluirPerfil: async (id: string) => {
    await api.delete(`/v1/perfis-permissao/${id}`)
  },
}

// =====================================================
// API Functions - Metas
// =====================================================

export const metasApi = {
  listar: async (params?: Record<string, string>) => {
    const { data } = await api.get('/v1/metas', { params })
    return data as { metas: Meta[]; total: number }
  },

  criar: async (payload: Record<string, unknown>) => {
    const { data } = await api.post('/v1/metas', payload)
    return data as Meta
  },

  atualizar: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/v1/metas/${id}`, payload)
    return data as Meta
  },

  excluir: async (id: string) => {
    await api.delete(`/v1/metas/${id}`)
  },

  distribuir: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.post(`/v1/metas/${id}/distribuir`, payload)
    return data
  },
}
