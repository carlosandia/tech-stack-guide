/**
 * AIDEV-NOTE: Service CRUD para tabela origens
 * Canais de aquisição dinâmicos por tenant
 */

import { supabase } from '@/lib/supabase'

export interface Origem {
  id: string
  organizacao_id: string
  nome: string
  slug: string
  cor: string | null
  padrao_sistema: boolean
  ativo: boolean
  criado_em: string
}

export interface CriarOrigemPayload {
  nome: string
  slug?: string
  cor?: string | null
}

export interface AtualizarOrigemPayload {
  nome?: string
  cor?: string | null
  ativo?: boolean
}

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export const origensApi = {
  async listar(apenasAtivas = false): Promise<Origem[]> {
    let query = supabase
      .from('origens')
      .select('*')
      .order('padrao_sistema', { ascending: false })
      .order('nome')

    if (apenasAtivas) {
      query = query.eq('ativo', true)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as Origem[]
  },

  async criar(payload: CriarOrigemPayload): Promise<Origem> {
    const slug = payload.slug || generateSlug(payload.nome)

    // AIDEV-NOTE: Buscar organizacao_id do usuário autenticado para satisfazer RLS
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('Usuário não autenticado')

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('auth_id', userData.user.id)
      .maybeSingle()

    if (!usuario?.organizacao_id) throw new Error('Organização não encontrada')

    const { data, error } = await supabase
      .from('origens')
      .insert({
        nome: payload.nome,
        slug,
        cor: payload.cor || null,
        organizacao_id: usuario.organizacao_id,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Origem
  },

  async atualizar(id: string, payload: AtualizarOrigemPayload): Promise<Origem> {
    const { data, error } = await supabase
      .from('origens')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Origem
  },

  async excluir(id: string): Promise<void> {
    const { error } = await supabase
      .from('origens')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
