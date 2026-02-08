/**
 * AIDEV-NOTE: Service layer para módulo de Conversas (PRD-09)
 * Todas chamadas passam pelo Axios (api.ts) para o backend Express
 * Diferente de outros módulos que acessam Supabase diretamente
 */

import api from '@/lib/api'

// =====================================================
// Types (espelham os schemas do backend)
// =====================================================

export interface ConversaContato {
  id: string
  nome: string
  email?: string | null
  telefone?: string | null
  foto_url?: string | null
}

export interface UltimaMensagemPreview {
  id: string
  tipo: string
  body?: string | null
  from_me: boolean
  criado_em: string
}

export interface Conversa {
  id: string
  organizacao_id: string
  contato_id: string
  usuario_id: string
  sessao_whatsapp_id?: string | null
  conexao_instagram_id?: string | null
  chat_id: string
  canal: 'whatsapp' | 'instagram'
  tipo: 'individual' | 'grupo' | 'canal'
  nome?: string | null
  foto_url?: string | null
  status: 'aberta' | 'pendente' | 'fechada'
  total_mensagens: number
  mensagens_nao_lidas: number
  ultima_mensagem_em?: string | null
  primeira_mensagem_em?: string | null
  status_alterado_em?: string | null
  criado_em: string
  atualizado_em: string
  contato?: ConversaContato
  ultima_mensagem?: UltimaMensagemPreview | null
}

export interface ListarConversasParams {
  canal?: 'whatsapp' | 'instagram'
  status?: 'aberta' | 'pendente' | 'fechada'
  busca?: string
  page?: number
  limit?: number
}

export interface ListarConversasResponse {
  conversas: Conversa[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface Mensagem {
  id: string
  organizacao_id: string
  conversa_id: string
  message_id: string
  from_me: boolean
  from_number?: string | null
  to_number?: string | null
  participant?: string | null
  tipo: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | 'poll' | 'reaction'
  body?: string | null
  caption?: string | null
  has_media: boolean
  media_url?: string | null
  media_mimetype?: string | null
  media_filename?: string | null
  media_size?: number | null
  media_duration?: number | null
  location_latitude?: number | null
  location_longitude?: number | null
  location_name?: string | null
  location_address?: string | null
  vcard?: string | null
  poll_question?: string | null
  poll_options?: Array<{ text: string; votes: number }> | null
  poll_allow_multiple?: boolean | null
  reaction_emoji?: string | null
  reaction_message_id?: string | null
  reply_to_message_id?: string | null
  ack: number
  ack_name?: string | null
  timestamp_externo?: number | null
  criado_em: string
  atualizado_em: string
}

export interface ListarMensagensParams {
  page?: number
  limit?: number
  antes_de?: string
  order_dir?: 'asc' | 'desc'
}

export interface ListarMensagensResponse {
  mensagens: Mensagem[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface MensagemPronta {
  id: string
  organizacao_id: string
  usuario_id?: string | null
  atalho: string
  titulo: string
  conteudo: string
  tipo: 'pessoal' | 'global'
  ativo: boolean
  vezes_usado: number
  criado_em: string
  atualizado_em: string
}

export interface NotaContato {
  id: string
  organizacao_id: string
  contato_id: string
  usuario_id: string
  conteudo: string
  criado_em: string
  atualizado_em: string
  usuario?: { id: string; nome: string }
}

// =====================================================
// API Functions
// =====================================================

export const conversasApi = {
  // --- Conversas ---

  async listar(params?: ListarConversasParams): Promise<ListarConversasResponse> {
    const { data } = await api.get('/v1/conversas', { params })
    return data
  },

  async buscarPorId(id: string): Promise<Conversa> {
    const { data } = await api.get(`/v1/conversas/${id}`)
    return data
  },

  async criar(dados: { contato_id?: string; telefone?: string; canal: 'whatsapp' | 'instagram'; mensagem_inicial: string }): Promise<Conversa> {
    const { data } = await api.post('/v1/conversas', dados)
    return data
  },

  async alterarStatus(id: string, status: 'aberta' | 'pendente' | 'fechada'): Promise<Conversa> {
    const { data } = await api.patch(`/v1/conversas/${id}/status`, { status })
    return data
  },

  async marcarComoLida(id: string): Promise<void> {
    await api.post(`/v1/conversas/${id}/marcar-lida`)
  },

  // --- Mensagens ---

  async listarMensagens(conversaId: string, params?: ListarMensagensParams): Promise<ListarMensagensResponse> {
    const { data } = await api.get(`/v1/conversas/${conversaId}/mensagens`, { params })
    return data
  },

  async enviarTexto(conversaId: string, texto: string, replyTo?: string): Promise<Mensagem> {
    const { data } = await api.post(`/v1/conversas/${conversaId}/mensagens/texto`, {
      texto,
      reply_to: replyTo,
    })
    return data
  },

  async enviarMedia(conversaId: string, dados: { tipo: string; media_url: string; caption?: string; filename?: string }): Promise<Mensagem> {
    const { data } = await api.post(`/v1/conversas/${conversaId}/mensagens/media`, dados)
    return data
  },

  // --- Mensagens Prontas ---

  async listarProntas(params?: { busca?: string }): Promise<{ mensagens_prontas: MensagemPronta[]; total: number }> {
    const { data } = await api.get('/v1/mensagens-prontas', { params })
    return data
  },

  async criarPronta(dados: { atalho: string; titulo: string; conteudo: string; tipo?: 'pessoal' | 'global' }): Promise<MensagemPronta> {
    const { data } = await api.post('/v1/mensagens-prontas', dados)
    return data
  },

  async excluirPronta(id: string): Promise<void> {
    await api.delete(`/v1/mensagens-prontas/${id}`)
  },

  // --- Notas do Contato ---

  async listarNotas(contatoId: string): Promise<{ notas: NotaContato[]; total: number }> {
    const { data } = await api.get(`/v1/contatos/${contatoId}/notas`)
    return data
  },

  async criarNota(contatoId: string, conteudo: string): Promise<NotaContato> {
    const { data } = await api.post(`/v1/contatos/${contatoId}/notas`, { conteudo })
    return data
  },
}

export default conversasApi
