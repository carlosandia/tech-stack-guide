/**
 * AIDEV-NOTE: Service API para Formulários
 * Conforme PRD-17 - Módulo de Formulários Avançados
 * Usa Supabase client direto (respeita RLS)
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

supabase.auth.onAuthStateChange(() => {
  _cachedOrgId = null
})

// =====================================================
// Types
// =====================================================

export type TipoFormulario = 'inline' | 'popup' | 'landing_page' | 'newsletter' | 'multi_step'
export type StatusFormulario = 'rascunho' | 'publicado' | 'arquivado'

export interface Formulario {
  id: string
  organizacao_id: string
  nome: string
  slug: string
  tipo: TipoFormulario
  status: StatusFormulario
  descricao?: string | null
  url_redirecionamento?: string | null
  mensagem_sucesso?: string | null
  funil_id?: string | null
  etapa_destino_id?: string | null
  criar_oportunidade_automatico?: boolean
  notificar_responsavel?: boolean
  ab_testing_ativo?: boolean
  total_submissoes?: number
  total_visualizacoes?: number
  publicado_em?: string | null
  criado_em: string
  atualizado_em: string
  deletado_em?: string | null
}

export interface ListarFormulariosParams {
  busca?: string
  status?: StatusFormulario | ''
  tipo?: TipoFormulario | ''
  pagina?: number
  por_pagina?: number
}

export interface ListarFormulariosResult {
  data: Formulario[]
  total: number
  pagina: number
  por_pagina: number
}

// =====================================================
// API
// =====================================================

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
}

async function listar(params?: ListarFormulariosParams): Promise<ListarFormulariosResult> {
  const pagina = params?.pagina || 1
  const por_pagina = params?.por_pagina || 20
  const from = (pagina - 1) * por_pagina
  const to = from + por_pagina - 1

  let query = supabase
    .from('formularios')
    .select('id, nome, slug, tipo, status, descricao, total_submissoes, total_visualizacoes, publicado_em, criado_em, atualizado_em, organizacao_id, url_redirecionamento, mensagem_sucesso, funil_id, ab_testing_ativo, deletado_em', { count: 'exact' })
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  if (params?.busca) {
    query = query.ilike('nome', `%${params.busca}%`)
  }
  if (params?.status) {
    query = query.eq('status', params.status)
  }
  if (params?.tipo) {
    query = query.eq('tipo', params.tipo)
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(`Erro ao listar formulários: ${error.message}`)

  return {
    data: (data || []) as unknown as Formulario[],
    total: count || 0,
    pagina,
    por_pagina,
  }
}

async function buscar(id: string): Promise<Formulario> {
  const { data, error } = await supabase
    .from('formularios')
    .select('*')
    .eq('id', id)
    .is('deletado_em', null)
    .single()

  if (error) throw new Error(`Erro ao buscar formulário: ${error.message}`)
  return data as Formulario
}

async function criar(payload: {
  nome: string
  tipo: TipoFormulario
  descricao?: string
}): Promise<Formulario> {
  const organizacao_id = await getOrganizacaoId()
  const slug = gerarSlug(payload.nome) + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('formularios')
    .insert({
      organizacao_id,
      nome: payload.nome,
      slug,
      tipo: payload.tipo,
      descricao: payload.descricao || null,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar formulário: ${error.message}`)
  return data as Formulario
}

async function atualizar(id: string, payload: Partial<Formulario>): Promise<Formulario> {
  const { data, error } = await supabase
    .from('formularios')
    .update(payload)
    .eq('id', id)
    .is('deletado_em', null)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar formulário: ${error.message}`)
  return data as Formulario
}

async function excluir(id: string): Promise<void> {
  const { error } = await supabase
    .from('formularios')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir formulário: ${error.message}`)
}

async function duplicar(id: string): Promise<Formulario> {
  const original = await buscar(id)
  const organizacao_id = await getOrganizacaoId()
  const novoNome = `${original.nome} (cópia)`
  const slug = gerarSlug(novoNome) + '-' + Date.now().toString(36)

  const { data, error } = await supabase
    .from('formularios')
    .insert({
      organizacao_id,
      nome: novoNome,
      slug,
      tipo: original.tipo,
      descricao: original.descricao,
      url_redirecionamento: original.url_redirecionamento,
      mensagem_sucesso: original.mensagem_sucesso,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao duplicar formulário: ${error.message}`)
  return data as Formulario
}

async function publicar(id: string): Promise<Formulario> {
  return atualizar(id, {
    status: 'publicado',
    publicado_em: new Date().toISOString(),
  } as Partial<Formulario>)
}

async function despublicar(id: string): Promise<Formulario> {
  return atualizar(id, { status: 'rascunho' } as Partial<Formulario>)
}

async function contarPorStatus(): Promise<Record<string, number>> {
  const organizacao_id = await getOrganizacaoId()

  const { data, error } = await supabase
    .from('formularios')
    .select('status')
    .eq('organizacao_id', organizacao_id)
    .is('deletado_em', null)

  if (error) throw new Error(`Erro ao contar formulários: ${error.message}`)

  const contagem: Record<string, number> = { todos: 0, rascunho: 0, publicado: 0, arquivado: 0 }
  for (const item of data || []) {
    contagem.todos++
    contagem[item.status] = (contagem[item.status] || 0) + 1
  }
  return contagem
}

export const formulariosApi = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  duplicar,
  publicar,
  despublicar,
  contarPorStatus,
}
