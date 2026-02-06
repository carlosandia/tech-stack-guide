/**
 * AIDEV-NOTE: Service API para Contatos e Segmentos
 * Usa axios (api) para comunicar com backend Express
 * Conforme PRD-06 - Modulo de Contatos
 */

import api from '@/lib/api'

// =====================================================
// Types
// =====================================================

export type TipoContato = 'pessoa' | 'empresa'
export type StatusContato = 'novo' | 'lead' | 'mql' | 'sql' | 'cliente' | 'perdido'
export type OrigemContato = 'manual' | 'importacao' | 'formulario' | 'whatsapp' | 'instagram' | 'meta_ads' | 'indicacao' | 'outro'

export interface Contato {
  id: string
  organizacao_id: string
  tipo: TipoContato
  status: StatusContato
  origem: OrigemContato
  nome?: string | null
  sobrenome?: string | null
  email?: string | null
  telefone?: string | null
  cargo?: string | null
  empresa_id?: string | null
  linkedin_url?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  cnpj?: string | null
  website?: string | null
  segmento?: string | null
  porte?: string | null
  endereco_cep?: string | null
  endereco_logradouro?: string | null
  endereco_numero?: string | null
  endereco_complemento?: string | null
  endereco_bairro?: string | null
  endereco_cidade?: string | null
  endereco_estado?: string | null
  observacoes?: string | null
  owner_id?: string | null
  criado_por?: string | null
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
  // Campos enriquecidos
  empresa?: { id: string; razao_social?: string; nome_fantasia?: string } | null
  segmentos?: Array<{ id: string; nome: string; cor: string }>
  owner?: { nome: string; sobrenome?: string } | null
  total_oportunidades?: number
  pessoas?: Array<{ id: string; nome: string; sobrenome?: string; email?: string; telefone?: string; cargo?: string; status: string }>
}

export interface Segmento {
  id: string
  organizacao_id: string
  nome: string
  cor: string
  descricao?: string | null
  total_contatos?: number
  criado_em: string
  atualizado_em: string
}

export interface ListaContatosResponse {
  contatos: Contato[]
  total: number
  page: number
  per_page: number
  total_paginas: number
}

export interface ListarContatosParams {
  tipo?: TipoContato
  status?: StatusContato
  origem?: OrigemContato
  owner_id?: string
  segmento_id?: string
  empresa_id?: string
  busca?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
  ordenar_por?: string
  ordem?: string
}

// =====================================================
// API Contatos
// =====================================================

export const contatosApi = {
  listar: async (params?: ListarContatosParams): Promise<ListaContatosResponse> => {
    const { data } = await api.get('/v1/contatos', { params })
    return data
  },

  buscar: async (id: string): Promise<Contato> => {
    const { data } = await api.get(`/v1/contatos/${id}`)
    return data
  },

  criar: async (payload: Record<string, unknown>): Promise<Contato> => {
    const { data } = await api.post('/v1/contatos', payload)
    return data
  },

  atualizar: async (id: string, payload: Record<string, unknown>): Promise<Contato> => {
    const { data } = await api.patch(`/v1/contatos/${id}`, payload)
    return data
  },

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/v1/contatos/${id}`)
  },

  excluirLote: async (payload: { ids: string[]; tipo: TipoContato }): Promise<{ excluidos: number; erros: string[] }> => {
    const { data } = await api.delete('/v1/contatos/lote', { data: payload })
    return data
  },

  atribuirLote: async (payload: { ids: string[]; owner_id: string | null }): Promise<void> => {
    await api.patch('/v1/contatos/lote/atribuir', payload)
  },

  duplicatas: async () => {
    const { data } = await api.get('/v1/contatos/duplicatas')
    return data
  },

  mesclar: async (payload: { contato_manter_id: string; contato_mesclar_id: string; campos_mesclar?: string[] }): Promise<void> => {
    await api.post('/v1/contatos/mesclar', payload)
  },

  exportar: async (params?: ListarContatosParams): Promise<string> => {
    const { data } = await api.get('/v1/contatos/exportar', { params, responseType: 'text' as any })
    return data
  },

  vincularSegmentos: async (contatoId: string, segmentoIds: string[]): Promise<void> => {
    await api.post(`/v1/contatos/${contatoId}/segmentos`, { segmento_ids: segmentoIds })
  },

  desvincularSegmento: async (contatoId: string, segmentoId: string): Promise<void> => {
    await api.delete(`/v1/contatos/${contatoId}/segmentos/${segmentoId}`)
  },

  segmentarLote: async (payload: { ids: string[]; adicionar: string[]; remover: string[] }): Promise<void> => {
    await api.post('/v1/contatos/lote/segmentos', payload)
  },
}

// =====================================================
// API Segmentos
// =====================================================

export const segmentosApi = {
  listar: async (): Promise<{ segmentos: Segmento[]; total: number }> => {
    const { data } = await api.get('/v1/segmentos')
    return data
  },

  criar: async (payload: { nome: string; cor: string; descricao?: string }): Promise<Segmento> => {
    const { data } = await api.post('/v1/segmentos', payload)
    return data
  },

  atualizar: async (id: string, payload: { nome?: string; cor?: string; descricao?: string | null }): Promise<Segmento> => {
    const { data } = await api.patch(`/v1/segmentos/${id}`, payload)
    return data
  },

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/v1/segmentos/${id}`)
  },
}
